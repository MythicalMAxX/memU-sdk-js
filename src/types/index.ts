/**
 * @fileoverview Type exports for the MemU SDK.
 *
 * @packageDocumentation
 * @module @memu/sdk/types
 */

// Public model types
export {
    TaskStatusEnum,
    type ResourceModality,
    type MemoryType,
    type MemoryResource,
    type MemoryItem,
    type MemoryCategory,
    type TaskStatus,
    type MemorizeResult,
    type RetrieveResult,
    type ConversationMessage,
} from './models.js';

// Request option types
export {
    type MemUClientOptions,
    type MemorizeOptions,
    type RetrieveOptions,
    type ListCategoriesOptions,
} from './requests.js';

// Internal response types (for advanced usage)
export type {
    ApiMemoryResource,
    ApiMemoryItem,
    ApiMemoryCategory,
    ApiTaskStatus,
    ApiMemorizeResponse,
    ApiRetrieveResponse,
    ApiCategoriesResponse,
    ApiErrorResponse,
    ApiValidationError,
} from './responses.js';
