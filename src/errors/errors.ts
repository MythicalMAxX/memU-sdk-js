/**
 * @fileoverview Custom error classes for the MemU SDK.
 *
 * This module provides a hierarchy of error types for handling different
 * failure scenarios when interacting with the MemU Cloud API.
 *
 * @packageDocumentation
 * @module @memu/sdk/errors
 */

/**
 * Base error class for all MemU SDK errors.
 *
 * @remarks
 * All SDK-specific errors extend this class, allowing you to catch
 * any MemU-related error with a single catch block.
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ... });
 * } catch (error) {
 *   if (error instanceof MemUClientError) {
 *     console.error(`MemU API error: ${error.message}`);
 *     console.error(`Status code: ${error.statusCode}`);
 *   }
 * }
 * ```
 */
export class MemUClientError extends Error {
    /**
     * HTTP status code from the API response, if available.
     */
    public readonly statusCode?: number;

    /**
     * Raw response body from the API, if available.
     */
    public readonly response?: Readonly<Record<string, unknown>>;

    /**
     * Creates a new MemUClientError.
     *
     * @param message - Human-readable error message
     * @param statusCode - HTTP status code from the API
     * @param response - Raw response body from the API
     */
    constructor(
        message: string,
        statusCode?: number,
        response?: Readonly<Record<string, unknown>>,
    ) {
        super(message);
        this.name = 'MemUClientError';
        this.statusCode = statusCode;
        this.response = response;

        // Maintains proper stack trace in V8 environments (Node.js, Chrome)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        // Ensure prototype chain is correctly set (for ES5 targets)
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            response: this.response,
        };
    }
}

/**
 * Error thrown when API authentication fails.
 *
 * @remarks
 * Typically indicates an invalid, expired, or missing API key.
 * HTTP status code: 401
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ... });
 * } catch (error) {
 *   if (error instanceof MemUAuthenticationError) {
 *     console.error('Invalid API key. Please check your credentials.');
 *   }
 * }
 * ```
 */
export class MemUAuthenticationError extends MemUClientError {
    /**
     * Default error message for authentication failures.
     */
    private static readonly DEFAULT_MESSAGE =
        'Authentication failed. Please check your API key.';

    /**
     * Creates a new MemUAuthenticationError.
     *
     * @param message - Optional custom error message
     * @param statusCode - HTTP status code (typically 401)
     * @param response - Raw response body from the API
     */
    constructor(
        message?: string,
        statusCode: number = 401,
        response?: Readonly<Record<string, unknown>>,
    ) {
        super(message ?? MemUAuthenticationError.DEFAULT_MESSAGE, statusCode, response);
        this.name = 'MemUAuthenticationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Error thrown when the API rate limit is exceeded.
 *
 * @remarks
 * The MemU API enforces rate limits to ensure fair usage.
 * When exceeded, wait for the duration specified in `retryAfter` before retrying.
 * HTTP status code: 429
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ... });
 * } catch (error) {
 *   if (error instanceof MemURateLimitError) {
 *     const waitTime = error.retryAfter ?? 60;
 *     console.log(`Rate limited. Retry in ${waitTime} seconds.`);
 *     await sleep(waitTime * 1000);
 *   }
 * }
 * ```
 */
export class MemURateLimitError extends MemUClientError {
    /**
     * Number of seconds to wait before retrying, from the Retry-After header.
     */
    public readonly retryAfter?: number;

    /**
     * Creates a new MemURateLimitError.
     *
     * @param message - Error message
     * @param retryAfter - Seconds to wait before retrying
     * @param statusCode - HTTP status code (typically 429)
     * @param response - Raw response body from the API
     */
    constructor(
        message: string = 'Rate limit exceeded. Please slow down your requests.',
        retryAfter?: number,
        statusCode: number = 429,
        response?: Readonly<Record<string, unknown>>,
    ) {
        super(message, statusCode, response);
        this.name = 'MemURateLimitError';
        this.retryAfter = retryAfter;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}

/**
 * Error thrown when a requested resource is not found.
 *
 * @remarks
 * Indicates that the requested resource (task, memory, category, etc.) does not exist.
 * HTTP status code: 404
 *
 * @example
 * ```typescript
 * try {
 *   await client.getTaskStatus('nonexistent_task_id');
 * } catch (error) {
 *   if (error instanceof MemUNotFoundError) {
 *     console.error('Task not found. It may have expired.');
 *   }
 * }
 * ```
 */
export class MemUNotFoundError extends MemUClientError {
    /**
     * The resource identifier that was not found.
     */
    public readonly resourceId?: string;

    /**
     * Creates a new MemUNotFoundError.
     *
     * @param message - Error message
     * @param resourceId - ID of the resource that was not found
     * @param statusCode - HTTP status code (typically 404)
     * @param response - Raw response body from the API
     */
    constructor(
        message: string = 'Resource not found.',
        resourceId?: string,
        statusCode: number = 404,
        response?: Readonly<Record<string, unknown>>,
    ) {
        super(message, statusCode, response);
        this.name = 'MemUNotFoundError';
        this.resourceId = resourceId;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            resourceId: this.resourceId,
        };
    }
}

/**
 * Error thrown when request validation fails.
 *
 * @remarks
 * Indicates that the request payload failed server-side validation.
 * Check the `validationErrors` property for detailed field-level errors.
 * HTTP status code: 422
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ userId: '', agentId: '' });
 * } catch (error) {
 *   if (error instanceof MemUValidationError) {
 *     console.error('Validation errors:', error.validationErrors);
 *   }
 * }
 * ```
 */
export class MemUValidationError extends MemUClientError {
    /**
     * Default error message for validation failures.
     */
    private static readonly DEFAULT_MESSAGE =
        'Request validation failed. Please check your request parameters.';

    /**
     * Detailed validation errors from the API.
     */
    public readonly validationErrors?: readonly ValidationError[];

    /**
     * Creates a new MemUValidationError.
     *
     * @param message - Optional custom error message
     * @param validationErrors - Detailed validation errors
     * @param statusCode - HTTP status code (typically 422)
     * @param response - Raw response body from the API
     */
    constructor(
        message?: string,
        validationErrors?: readonly ValidationError[],
        statusCode: number = 422,
        response?: Readonly<Record<string, unknown>>,
    ) {
        super(message ?? MemUValidationError.DEFAULT_MESSAGE, statusCode, response);
        this.name = 'MemUValidationError';
        this.validationErrors = validationErrors;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            validationErrors: this.validationErrors,
        };
    }
}

/**
 * A single validation error detail.
 */
export interface ValidationError {
    /** Field path that failed validation */
    readonly field: string;
    /** Validation error message */
    readonly message: string;
    /** Validation error type/code */
    readonly type: string;
}

/**
 * Error thrown when a request times out.
 *
 * @remarks
 * Indicates that the request exceeded the configured timeout duration.
 * Consider increasing the timeout or checking network connectivity.
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ..., waitForCompletion: true, timeout: 5000 });
 * } catch (error) {
 *   if (error instanceof MemUTimeoutError) {
 *     console.error(`Request timed out after ${error.timeout}ms`);
 *   }
 * }
 * ```
 */
export class MemUTimeoutError extends MemUClientError {
    /**
     * Timeout duration in milliseconds.
     */
    public readonly timeout: number;

    /**
     * Creates a new MemUTimeoutError.
     *
     * @param message - Error message
     * @param timeout - Timeout duration in milliseconds
     */
    constructor(message: string, timeout: number) {
        super(message);
        this.name = 'MemUTimeoutError';
        this.timeout = timeout;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            timeout: this.timeout,
        };
    }
}

/**
 * Error thrown when a network error occurs.
 *
 * @remarks
 * Indicates a network-level failure such as connection refused,
 * DNS resolution failure, or connection reset.
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ... });
 * } catch (error) {
 *   if (error instanceof MemUNetworkError) {
 *     console.error('Network error:', error.cause);
 *   }
 * }
 * ```
 */
export class MemUNetworkError extends MemUClientError {
    /**
     * The underlying error that caused this network error.
     */
    public readonly originalError?: Error;

    /**
     * Creates a new MemUNetworkError.
     *
     * @param message - Error message
     * @param originalError - The underlying error
     */
    constructor(message: string, originalError?: Error) {
        super(message);
        this.name = 'MemUNetworkError';
        this.originalError = originalError;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            originalError: this.originalError?.message,
        };
    }
}

/**
 * Error thrown when all retry attempts are exhausted.
 *
 * @remarks
 * Indicates that the request failed after all configured retry attempts.
 * Contains information about the number of attempts made.
 *
 * @example
 * ```typescript
 * try {
 *   await client.memorize({ ... });
 * } catch (error) {
 *   if (error instanceof MemURetryExhaustedError) {
 *     console.error(`Failed after ${error.attempts} attempts`);
 *   }
 * }
 * ```
 */
export class MemURetryExhaustedError extends MemUClientError {
    /**
     * Number of retry attempts made.
     */
    public readonly attempts: number;

    /**
     * The last error that occurred before exhausting retries.
     */
    public readonly lastError?: Error;

    /**
     * Creates a new MemURetryExhaustedError.
     *
     * @param message - Error message
     * @param attempts - Number of retry attempts made
     * @param lastError - The last error that occurred
     */
    constructor(message: string, attempts: number, lastError?: Error) {
        super(message);
        this.name = 'MemURetryExhaustedError';
        this.attempts = attempts;
        this.lastError = lastError;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Returns a JSON-serializable representation of the error.
     */
    public override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            attempts: this.attempts,
            lastError: this.lastError?.message,
        };
    }
}

/**
 * Type guard to check if an error is a MemUClientError.
 *
 * @param error - The error to check
 * @returns True if the error is a MemUClientError or subclass
 *
 * @example
 * ```typescript
 * if (isMemUError(error)) {
 *   console.error('MemU error:', error.message);
 * }
 * ```
 */
export function isMemUError(error: unknown): error is MemUClientError {
    return error instanceof MemUClientError;
}

/**
 * Type guard to check if an error is retryable.
 *
 * @param error - The error to check
 * @returns True if the error indicates a retryable condition
 *
 * @example
 * ```typescript
 * if (isRetryableError(error)) {
 *   await sleep(1000);
 *   // retry the request
 * }
 * ```
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof MemURateLimitError) return true;
    if (error instanceof MemUNetworkError) return true;
    if (error instanceof MemUTimeoutError) return true;
    if (error instanceof MemUClientError) {
        const status = error.statusCode;
        // Retry on 5xx server errors
        return status !== undefined && status >= 500 && status < 600;
    }
    return false;
}
