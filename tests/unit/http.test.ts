/**
 * Unit tests for HTTP client and retry logic.
 */

import {
    calculateDelay,
    DEFAULT_RETRY_OPTIONS,
    type RetryOptions,
} from '../../src/http/retry.js';

describe('calculateDelay', () => {
    const options: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: false,
    };

    describe('without jitter', () => {
        it('should return base delay for first attempt', () => {
            const delay = calculateDelay(0, options);
            expect(delay).toBe(1000);
        });

        it('should double delay for second attempt', () => {
            const delay = calculateDelay(1, options);
            expect(delay).toBe(2000);
        });

        it('should quadruple delay for third attempt', () => {
            const delay = calculateDelay(2, options);
            expect(delay).toBe(4000);
        });

        it('should cap delay at maxDelay', () => {
            const delay = calculateDelay(10, options);
            expect(delay).toBe(30000);
        });
    });

    describe('with jitter', () => {
        const jitterOptions: RetryOptions = {
            ...options,
            jitter: true,
        };

        it('should add randomization to delay', () => {
            const delays = new Set<number>();
            for (let i = 0; i < 10; i++) {
                delays.add(calculateDelay(0, jitterOptions));
            }
            // With jitter, we should get some variation
            expect(delays.size).toBeGreaterThan(1);
        });

        it('should stay within ±25% of base delay', () => {
            for (let i = 0; i < 50; i++) {
                const delay = calculateDelay(0, jitterOptions);
                expect(delay).toBeGreaterThanOrEqual(750);
                expect(delay).toBeLessThanOrEqual(1250);
            }
        });
    });

    describe('with retryAfter hint', () => {
        it('should use retryAfter value when provided', () => {
            const delay = calculateDelay(0, options, 60);
            expect(delay).toBe(60000); // 60 seconds in ms
        });

        it('should prefer retryAfter over calculated delay', () => {
            const delay = calculateDelay(5, options, 10);
            expect(delay).toBe(10000);
        });

        it('should ignore retryAfter if zero', () => {
            const delay = calculateDelay(1, options, 0);
            expect(delay).toBe(2000);
        });

        it('should ignore retryAfter if negative', () => {
            const delay = calculateDelay(1, options, -5);
            expect(delay).toBe(2000);
        });
    });
});

describe('DEFAULT_RETRY_OPTIONS', () => {
    it('should have maxRetries of 3', () => {
        expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
    });

    it('should have baseDelay of 1000', () => {
        expect(DEFAULT_RETRY_OPTIONS.baseDelay).toBe(1000);
    });

    it('should have maxDelay of 30000', () => {
        expect(DEFAULT_RETRY_OPTIONS.maxDelay).toBe(30000);
    });

    it('should have backoffMultiplier of 2', () => {
        expect(DEFAULT_RETRY_OPTIONS.backoffMultiplier).toBe(2);
    });

    it('should have jitter enabled', () => {
        expect(DEFAULT_RETRY_OPTIONS.jitter).toBe(true);
    });
});

describe('HttpClient', () => {
    // Note: Full HTTP client tests would require mocking fetch
    // These tests verify the module exports correctly

    it('should export HttpClient class', async () => {
        const { HttpClient } = await import('../../src/http/client.js');
        expect(HttpClient).toBeDefined();
    });

    it('should export DEFAULT_HTTP_OPTIONS', async () => {
        const { DEFAULT_HTTP_OPTIONS } = await import('../../src/http/client.js');
        expect(DEFAULT_HTTP_OPTIONS.timeout).toBe(60000);
    });
});
