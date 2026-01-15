/**
 * @fileoverview MemU JavaScript SDK - Official SDK for the MemU Cloud API.
 *
 * This package provides a high-performance, type-safe client for interacting
 * with the MemU Cloud API. It supports memory management for AI agents including
 * memorization, retrieval, and category organization.
 *
 * @packageDocumentation
 * @module @memu/sdk
 *
 * @example Basic Usage
 * ```typescript
 * import { MemUClient } from '@memu/sdk';
 *
 * const client = new MemUClient({ apiKey: 'your_api_key' });
 *
 * // Memorize a conversation
 * await client.memorize({
 *   conversation: [{ role: 'user', content: 'I love pizza' }],
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 * });
 *
 * // Retrieve memories
 * const result = await client.retrieve('What food does the user like?', {
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 * });
 *
 * console.log(result.items);
 *
 * await client.close();
 * ```
 */

// Main client export
export { MemUClient } from './client.js';

// Type exports
export {
    // Enums
    TaskStatusEnum,

    // Model types
    type ResourceModality,
    type MemoryType,
    type MemoryResource,
    type MemoryItem,
    type MemoryCategory,
    type TaskStatus,
    type MemorizeResult,
    type RetrieveResult,
    type ConversationMessage,

    // Request option types
    type MemUClientOptions,
    type MemorizeOptions,
    type RetrieveOptions,
    type ListCategoriesOptions,
} from './types/index.js';

// Error exports
export {
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
    type ValidationError,
} from './errors/index.js';

// HTTP utilities (for advanced usage)
export {
    withRetry,
    createRetryWrapper,
    type RetryOptions,
    type RetryResult,
} from './http/index.js';
