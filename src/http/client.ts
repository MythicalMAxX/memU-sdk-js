/**
 * @fileoverview HTTP client abstraction for the MemU SDK.
 *
 * Provides a platform-agnostic HTTP client that works in both
 * Node.js and browser environments, with built-in retry logic
 * and error handling.
 *
 * @packageDocumentation
 * @module @memu/sdk/http
 */

import {
    MemUAuthenticationError,
    MemUClientError,
    MemUNetworkError,
    MemUNotFoundError,
    MemURateLimitError,
    MemUTimeoutError,
    MemUValidationError,
    type ValidationError,
} from '../errors/index.js';
import type {
    ApiErrorResponse,
    ApiValidationError,
} from '../types/responses.js';
import { withRetry, type RetryOptions, DEFAULT_RETRY_OPTIONS } from './retry.js';

/**
 * HTTP methods supported by the client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Configuration options for the HTTP client.
 */
export interface HttpClientOptions {
    /**
     * Base URL for all requests.
     */
    readonly baseUrl: string;

    /**
     * Default headers to include in all requests.
     */
    readonly headers: Readonly<Record<string, string>>;

    /**
     * Request timeout in milliseconds.
     * @defaultValue 60000
     */
    readonly timeout: number;

    /**
     * Retry configuration.
     */
    readonly retry: RetryOptions;
}

/**
 * Options for individual HTTP requests.
 */
export interface RequestOptions {
    /**
     * HTTP method.
     */
    readonly method: HttpMethod;

    /**
     * Request path (appended to base URL).
     */
    readonly path: string;

    /**
     * JSON body to send.
     */
    readonly body?: unknown;

    /**
     * Query parameters.
     */
    readonly params?: Readonly<Record<string, string | number | boolean | undefined>>;

    /**
     * Additional headers for this request.
     */
    readonly headers?: Readonly<Record<string, string>>;

    /**
     * Override timeout for this request.
     */
    readonly timeout?: number;

    /**
     * Whether to skip retry logic for this request.
     * @defaultValue false
     */
    readonly skipRetry?: boolean;
}

/**
 * Response from an HTTP request.
 */
export interface HttpResponse<T = unknown> {
    /**
     * HTTP status code.
     */
    readonly status: number;

    /**
     * Response headers.
     */
    readonly headers: Headers;

    /**
     * Parsed response body.
     */
    readonly data: T;

    /**
     * Whether the request was successful (2xx status).
     */
    readonly ok: boolean;
}

/**
 * Default HTTP client options.
 */
export const DEFAULT_HTTP_OPTIONS: Omit<HttpClientOptions, 'baseUrl' | 'headers'> = {
    timeout: 60000,
    retry: DEFAULT_RETRY_OPTIONS,
} as const;

/**
 * HTTP client for making API requests.
 *
 * @remarks
 * Uses the native `fetch` API, which is available in:
 * - Node.js 18+
 * - All modern browsers
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Error classification and wrapping
 * - JSON request/response handling
 *
 * @example
 * ```typescript
 * const client = new HttpClient({
 *   baseUrl: 'https://api.memu.so',
 *   headers: { Authorization: 'Bearer api_key' },
 *   timeout: 30000,
 *   retry: { maxRetries: 3 },
 * });
 *
 * const response = await client.request({
 *   method: 'POST',
 *   path: '/api/v3/memory/memorize',
 *   body: { user_id: 'user_123', ... },
 * });
 * ```
 */
export class HttpClient {
    private readonly options: HttpClientOptions;

    /**
     * Creates a new HTTP client instance.
     *
     * @param options - Client configuration options
     */
    constructor(options: Partial<HttpClientOptions> & Pick<HttpClientOptions, 'baseUrl' | 'headers'>) {
        this.options = {
            ...DEFAULT_HTTP_OPTIONS,
            ...options,
            retry: {
                ...DEFAULT_RETRY_OPTIONS,
                ...options.retry,
            },
        };
    }

    /**
     * Makes an HTTP request with automatic retry handling.
     *
     * @typeParam T - Expected response data type
     * @param options - Request configuration
     * @returns Promise resolving to the response
     * @throws MemUClientError subclasses for various error conditions
     */
    public async request<T = unknown>(options: RequestOptions): Promise<HttpResponse<T>> {
        const execute = () => this.executeRequest<T>(options);

        if (options.skipRetry) {
            return execute();
        }

        const result = await withRetry(execute, this.options.retry);
        return result.value;
    }

    /**
     * Makes a GET request.
     *
     * @typeParam T - Expected response data type
     * @param path - Request path
     * @param params - Optional query parameters
     * @param options - Additional request options
     * @returns Promise resolving to the response
     */
    public async get<T = unknown>(
        path: string,
        params?: RequestOptions['params'],
        options?: Partial<Omit<RequestOptions, 'method' | 'path' | 'params'>>,
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'GET', path, params });
    }

    /**
     * Makes a POST request.
     *
     * @typeParam T - Expected response data type
     * @param path - Request path
     * @param body - Request body
     * @param options - Additional request options
     * @returns Promise resolving to the response
     */
    public async post<T = unknown>(
        path: string,
        body?: unknown,
        options?: Partial<Omit<RequestOptions, 'method' | 'path' | 'body'>>,
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'POST', path, body });
    }

    /**
     * Executes a single HTTP request without retry.
     *
     * @internal
     */
    private async executeRequest<T>(options: RequestOptions): Promise<HttpResponse<T>> {
        const url = this.buildUrl(options.path, options.params);
        const timeout = options.timeout ?? this.options.timeout;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: options.method,
                headers: this.buildHeaders(options.headers),
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });

            const data = await this.parseResponse<T>(response);

            // Handle error responses
            if (!response.ok) {
                this.handleErrorResponse(response.status, options.path, data);
            }

            return {
                status: response.status,
                headers: response.headers,
                data,
                ok: response.ok,
            };
        } catch (error) {
            // Handle abort (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new MemUTimeoutError(
                    `Request timed out after ${timeout}ms`,
                    timeout,
                );
            }

            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new MemUNetworkError(
                    `Network error: ${error.message}`,
                    error,
                );
            }

            // Re-throw MemU errors as-is
            if (error instanceof MemUClientError) {
                throw error;
            }

            // Wrap unknown errors
            throw new MemUNetworkError(
                error instanceof Error ? error.message : 'Unknown network error',
                error instanceof Error ? error : undefined,
            );
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Builds the full URL for a request.
     *
     * @internal
     */
    private buildUrl(
        path: string,
        params?: Readonly<Record<string, string | number | boolean | undefined>>,
    ): string {
        const baseUrl = this.options.baseUrl.replace(/\/+$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const url = new URL(`${baseUrl}${cleanPath}`);

        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    url.searchParams.set(key, String(value));
                }
            }
        }

        return url.toString();
    }

    /**
     * Builds headers for a request.
     *
     * @internal
     */
    private buildHeaders(
        additionalHeaders?: Readonly<Record<string, string>>,
    ): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'User-Agent': 'memu-js-sdk/1.0.0',
            ...this.options.headers,
            ...additionalHeaders,
        };
    }

    /**
     * Parses the response body.
     *
     * @internal
     */
    private async parseResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            try {
                return (await response.json()) as T;
            } catch {
                return {} as T;
            }
        }

        // For non-JSON responses, return empty object
        return {} as T;
    }

    /**
     * Handles error responses and throws appropriate exceptions.
     *
     * @internal
     */
    private handleErrorResponse(
        status: number,
        path: string,
        data: unknown,
    ): never {
        const errorData = data as ApiErrorResponse | undefined;
        const message = errorData?.message ?? errorData?.error ?? errorData?.detail?.toString();

        switch (status) {
            case 401:
                throw new MemUAuthenticationError(message, status, data as Record<string, unknown>);

            case 404:
                throw new MemUNotFoundError(
                    message ?? `Resource not found: ${path}`,
                    path,
                    status,
                    data as Record<string, unknown>,
                );

            case 422: {
                const validationErrors = this.parseValidationErrors(errorData);
                throw new MemUValidationError(
                    message,
                    validationErrors,
                    status,
                    data as Record<string, unknown>,
                );
            }

            case 429: {
                // Try to get retry-after from response
                const retryAfter = this.parseRetryAfter(data);
                throw new MemURateLimitError(
                    message ?? 'Rate limit exceeded',
                    retryAfter,
                    status,
                    data as Record<string, unknown>,
                );
            }

            default:
                throw new MemUClientError(
                    message ?? `Request failed with status ${status}`,
                    status,
                    data as Record<string, unknown>,
                );
        }
    }

    /**
     * Parses validation errors from API response.
     *
     * @internal
     */
    private parseValidationErrors(
        errorData: ApiErrorResponse | undefined,
    ): ValidationError[] | undefined {
        if (!errorData?.detail || !Array.isArray(errorData.detail)) {
            return undefined;
        }

        return (errorData.detail as ApiValidationError[]).map((err) => ({
            field: err.loc.join('.'),
            message: err.msg,
            type: err.type,
        }));
    }

    /**
     * Parses retry-after value from response.
     *
     * @internal
     */
    private parseRetryAfter(data: unknown): number | undefined {
        if (typeof data === 'object' && data !== null) {
            const obj = data as Record<string, unknown>;
            if (typeof obj['retry_after'] === 'number') {
                return obj['retry_after'];
            }
        }
        return undefined;
    }
}
