/**
 * Unit tests for custom error classes.
 */

import {
    MemUClientError,
    MemUAuthenticationError,
    MemURateLimitError,
    MemUNotFoundError,
    MemUValidationError,
    MemUTimeoutError,
    MemUNetworkError,
    MemURetryExhaustedError,
    isMemUError,
    isRetryableError,
} from '../../src/errors/index.js';

describe('MemUClientError', () => {
    it('should create error with message', () => {
        const error = new MemUClientError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('MemUClientError');
    });

    it('should create error with status code', () => {
        const error = new MemUClientError('Test error', 500);
        expect(error.statusCode).toBe(500);
    });

    it('should create error with response', () => {
        const response = { detail: 'Server error' };
        const error = new MemUClientError('Test error', 500, response);
        expect(error.response).toEqual(response);
    });

    it('should be instance of Error', () => {
        const error = new MemUClientError('Test');
        expect(error).toBeInstanceOf(Error);
    });

    it('should serialize to JSON', () => {
        const error = new MemUClientError('Test', 500, { detail: 'info' });
        const json = error.toJSON();
        expect(json).toEqual({
            name: 'MemUClientError',
            message: 'Test',
            statusCode: 500,
            response: { detail: 'info' },
        });
    });
});

describe('MemUAuthenticationError', () => {
    it('should use default message', () => {
        const error = new MemUAuthenticationError();
        expect(error.message).toBe('Authentication failed. Please check your API key.');
        expect(error.statusCode).toBe(401);
    });

    it('should accept custom message', () => {
        const error = new MemUAuthenticationError('Custom auth error');
        expect(error.message).toBe('Custom auth error');
    });

    it('should extend MemUClientError', () => {
        const error = new MemUAuthenticationError();
        expect(error).toBeInstanceOf(MemUClientError);
    });

    it('should have correct name', () => {
        const error = new MemUAuthenticationError();
        expect(error.name).toBe('MemUAuthenticationError');
    });
});

describe('MemURateLimitError', () => {
    it('should store retry-after value', () => {
        const error = new MemURateLimitError('Rate limited', 30);
        expect(error.retryAfter).toBe(30);
    });

    it('should default to status 429', () => {
        const error = new MemURateLimitError('Rate limited');
        expect(error.statusCode).toBe(429);
    });

    it('should include retryAfter in JSON', () => {
        const error = new MemURateLimitError('Test', 60);
        const json = error.toJSON();
        expect(json.retryAfter).toBe(60);
    });

    it('should extend MemUClientError', () => {
        const error = new MemURateLimitError('Test');
        expect(error).toBeInstanceOf(MemUClientError);
    });
});

describe('MemUNotFoundError', () => {
    it('should store resource ID', () => {
        const error = new MemUNotFoundError('Not found', 'resource_123');
        expect(error.resourceId).toBe('resource_123');
    });

    it('should default to status 404', () => {
        const error = new MemUNotFoundError('Not found');
        expect(error.statusCode).toBe(404);
    });

    it('should include resourceId in JSON', () => {
        const error = new MemUNotFoundError('Test', 'res_id');
        const json = error.toJSON();
        expect(json.resourceId).toBe('res_id');
    });
});

describe('MemUValidationError', () => {
    it('should use default message', () => {
        const error = new MemUValidationError();
        expect(error.message).toContain('validation failed');
    });

    it('should store validation errors', () => {
        const validationErrors = [
            { field: 'userId', message: 'Required', type: 'missing' },
        ];
        const error = new MemUValidationError('Invalid', validationErrors);
        expect(error.validationErrors).toEqual(validationErrors);
    });

    it('should default to status 422', () => {
        const error = new MemUValidationError();
        expect(error.statusCode).toBe(422);
    });
});

describe('MemUTimeoutError', () => {
    it('should store timeout value', () => {
        const error = new MemUTimeoutError('Timed out', 5000);
        expect(error.timeout).toBe(5000);
    });

    it('should include timeout in JSON', () => {
        const error = new MemUTimeoutError('Test', 30000);
        const json = error.toJSON();
        expect(json.timeout).toBe(30000);
    });
});

describe('MemUNetworkError', () => {
    it('should store original error', () => {
        const cause = new Error('Connection refused');
        const error = new MemUNetworkError('Network error', cause);
        expect(error.originalError).toBe(cause);
    });

    it('should include originalError message in JSON', () => {
        const cause = new Error('DNS failed');
        const error = new MemUNetworkError('Test', cause);
        const json = error.toJSON();
        expect(json.originalError).toBe('DNS failed');
    });
});

describe('MemURetryExhaustedError', () => {
    it('should store attempts count', () => {
        const error = new MemURetryExhaustedError('Failed after retries', 5);
        expect(error.attempts).toBe(5);
    });

    it('should store last error', () => {
        const lastError = new Error('Final failure');
        const error = new MemURetryExhaustedError('Failed', 3, lastError);
        expect(error.lastError).toBe(lastError);
    });

    it('should include attempts in JSON', () => {
        const error = new MemURetryExhaustedError('Test', 3);
        const json = error.toJSON();
        expect(json.attempts).toBe(3);
    });
});

describe('isMemUError', () => {
    it('should return true for MemUClientError', () => {
        expect(isMemUError(new MemUClientError('Test'))).toBe(true);
    });

    it('should return true for subclasses', () => {
        expect(isMemUError(new MemUAuthenticationError())).toBe(true);
        expect(isMemUError(new MemURateLimitError('Test'))).toBe(true);
        expect(isMemUError(new MemUNotFoundError('Test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
        expect(isMemUError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
        expect(isMemUError('string')).toBe(false);
        expect(isMemUError(null)).toBe(false);
        expect(isMemUError(undefined)).toBe(false);
    });
});

describe('isRetryableError', () => {
    it('should return true for rate limit error', () => {
        expect(isRetryableError(new MemURateLimitError('Test'))).toBe(true);
    });

    it('should return true for network error', () => {
        expect(isRetryableError(new MemUNetworkError('Test'))).toBe(true);
    });

    it('should return true for timeout error', () => {
        expect(isRetryableError(new MemUTimeoutError('Test', 5000))).toBe(true);
    });

    it('should return true for 5xx status codes', () => {
        expect(isRetryableError(new MemUClientError('Test', 500))).toBe(true);
        expect(isRetryableError(new MemUClientError('Test', 502))).toBe(true);
        expect(isRetryableError(new MemUClientError('Test', 503))).toBe(true);
    });

    it('should return false for 4xx status codes', () => {
        expect(isRetryableError(new MemUClientError('Test', 400))).toBe(false);
        expect(isRetryableError(new MemUClientError('Test', 401))).toBe(false);
        expect(isRetryableError(new MemUClientError('Test', 404))).toBe(false);
    });

    it('should return false for authentication error', () => {
        expect(isRetryableError(new MemUAuthenticationError())).toBe(false);
    });

    it('should return false for validation error', () => {
        expect(isRetryableError(new MemUValidationError())).toBe(false);
    });
});
