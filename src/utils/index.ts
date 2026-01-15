/**
 * @fileoverview Utility functions for validation and platform detection.
 *
 * @packageDocumentation
 * @module @memu/sdk/utils
 */

/**
 * Validates that a required string value is provided.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter (for error messages)
 * @throws Error if the value is not a non-empty string
 *
 * @internal
 */
export function validateRequiredString(value: unknown, name: string): asserts value is string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${name} is required and must be a non-empty string`);
    }
}

/**
 * Validates that an API key is provided and formatted correctly.
 *
 * @param apiKey - The API key to validate
 * @throws Error if the API key is invalid
 *
 * @internal
 */
export function validateApiKey(apiKey: unknown): asserts apiKey is string {
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new Error('API key is required');
    }
}

/**
 * Validates that either conversation or conversationText is provided.
 *
 * @param conversation - Structured conversation messages
 * @param conversationText - Raw conversation text
 * @throws Error if neither is provided
 *
 * @internal
 */
export function validateConversationInput(
    conversation: unknown,
    conversationText: unknown,
): void {
    if (!conversation && !conversationText) {
        throw new Error('Either conversation or conversationText must be provided');
    }

    if (conversation !== undefined && !Array.isArray(conversation)) {
        throw new Error('conversation must be an array of messages');
    }

    if (conversationText !== undefined && typeof conversationText !== 'string') {
        throw new Error('conversationText must be a string');
    }
}

/**
 * Detects if the current environment is a browser.
 *
 * @returns True if running in a browser environment
 *
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // Use browser-specific APIs
 * }
 * ```
 */
export function isBrowser(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.document !== 'undefined'
    );
}

/**
 * Detects if the current environment is Node.js.
 *
 * @returns True if running in Node.js
 *
 * @example
 * ```typescript
 * if (isNode()) {
 *   // Use Node.js-specific APIs
 * }
 * ```
 */
export function isNode(): boolean {
    return (
        typeof process !== 'undefined' &&
        process.versions?.node !== undefined
    );
}

/**
 * Detects if the current environment supports native fetch.
 *
 * @returns True if native fetch is available
 */
export function hasFetch(): boolean {
    return typeof fetch === 'function';
}

/**
 * Safely parses a date string to a Date object.
 *
 * @param dateString - ISO 8601 date string
 * @returns Date object or undefined if parsing fails
 *
 * @internal
 */
export function parseDate(dateString: string | undefined | null): Date | undefined {
    if (!dateString) return undefined;

    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? undefined : date;
    } catch {
        return undefined;
    }
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @param str - Snake case string
 * @returns Camel case string
 *
 * @internal
 */
export function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case.
 *
 * @param str - Camel case string
 * @returns Snake case string
 *
 * @internal
 */
export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Deep freezes an object to make it immutable.
 *
 * @param obj - Object to freeze
 * @returns The frozen object
 *
 * @internal
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
    Object.freeze(obj);

    for (const key of Object.keys(obj) as (keyof T)[]) {
        const value = obj[key];
        if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
            deepFreeze(value as object);
        }
    }

    return obj;
}
