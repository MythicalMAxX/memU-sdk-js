/**
 * @fileoverview Retry logic with exponential backoff for HTTP requests.
 *
 * Implements a robust retry mechanism with configurable backoff,
 * jitter, and maximum retry limits.
 *
 * @packageDocumentation
 * @module @memu/sdk/http
 */

import {
    MemURateLimitError,
    MemURetryExhaustedError,
    isRetryableError,
} from '../errors/index.js';

/**
 * Configuration options for retry behavior.
 */
export interface RetryOptions {
    /**
     * Maximum number of retry attempts.
     * @defaultValue 3
     */
    readonly maxRetries: number;

    /**
     * Base delay in milliseconds for exponential backoff.
     * @defaultValue 1000
     */
    readonly baseDelay: number;

    /**
     * Maximum delay in milliseconds between retries.
     * @defaultValue 30000
     */
    readonly maxDelay: number;

    /**
     * Factor by which the delay increases with each retry.
     * @defaultValue 2
     */
    readonly backoffMultiplier: number;

    /**
     * Whether to add random jitter to delays to prevent thundering herd.
     * @defaultValue true
     */
    readonly jitter: boolean;
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_OPTIONS: Readonly<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
} as const;

/**
 * Result of a retry operation.
 */
export interface RetryResult<T> {
    /** The successful result value */
    readonly value: T;
    /** Number of attempts made (1 = succeeded on first try) */
    readonly attempts: number;
}

/**
 * Calculates the delay before the next retry attempt.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry configuration options
 * @param retryAfter - Optional Retry-After value from rate limit response
 * @returns Delay in milliseconds
 *
 * @internal
 */
export function calculateDelay(
    attempt: number,
    options: RetryOptions,
    retryAfter?: number,
): number {
    // If we have a Retry-After header, use it (converted to ms)
    if (retryAfter !== undefined && retryAfter > 0) {
        return retryAfter * 1000;
    }

    // Calculate exponential backoff: baseDelay * (multiplier ^ attempt)
    const exponentialDelay =
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt);

    // Cap at maximum delay
    let delay = Math.min(exponentialDelay, options.maxDelay);

    // Add jitter if enabled (±25% randomization)
    if (options.jitter) {
        const jitterRange = delay * 0.25;
        const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
        delay = Math.max(0, delay + jitterOffset);
    }

    return Math.round(delay);
}

/**
 * Sleeps for the specified duration.
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 *
 * @internal
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async function with retry logic.
 *
 * @remarks
 * Uses exponential backoff with optional jitter. Automatically retries on:
 * - Rate limit errors (429)
 * - Server errors (5xx)
 * - Network errors
 * - Timeout errors
 *
 * @typeParam T - Return type of the function
 * @param fn - Async function to execute
 * @param options - Retry configuration (uses defaults if not provided)
 * @returns Promise resolving to the result with attempt count
 * @throws MemURetryExhaustedError if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 5, baseDelay: 500 }
 * );
 * console.log(`Succeeded after ${result.attempts} attempts`);
 * ```
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {},
): Promise<RetryResult<T>> {
    const config: RetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
    };

    let lastError: Error | undefined;
    let attempts = 0;

    while (attempts <= config.maxRetries) {
        attempts++;

        try {
            const value = await fn();
            return { value, attempts };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            if (attempts > config.maxRetries || !isRetryableError(error)) {
                throw error;
            }

            // Extract retry-after hint from rate limit errors
            let retryAfter: number | undefined;
            if (error instanceof MemURateLimitError) {
                retryAfter = error.retryAfter;
            }

            // Calculate and wait for delay
            const delay = calculateDelay(attempts - 1, config, retryAfter);
            await sleep(delay);
        }
    }

    // Should not reach here, but handle edge case
    throw new MemURetryExhaustedError(
        `Request failed after ${attempts} attempts`,
        attempts,
        lastError,
    );
}

/**
 * Creates a retry wrapper with pre-configured options.
 *
 * @remarks
 * Useful for creating a consistent retry policy across multiple operations.
 *
 * @param options - Retry configuration
 * @returns A function that wraps async operations with retry logic
 *
 * @example
 * ```typescript
 * const retryWithDefaults = createRetryWrapper({ maxRetries: 5 });
 *
 * const result1 = await retryWithDefaults(() => fetchData1());
 * const result2 = await retryWithDefaults(() => fetchData2());
 * ```
 */
export function createRetryWrapper(
    options: Partial<RetryOptions> = {},
): <T>(fn: () => Promise<T>) => Promise<RetryResult<T>> {
    const config: RetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
    };

    return <T>(fn: () => Promise<T>) => withRetry(fn, config);
}
