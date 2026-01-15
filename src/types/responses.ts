/**
 * @fileoverview API response types for the MemU Cloud API.
 *
 * These interfaces define the raw response structures from the API.
 * The SDK transforms these into the public-facing model types.
 *
 * @packageDocumentation
 * @module @memu/sdk/types
 * @internal
 */

/**
 * Raw API response for memory resource.
 * @internal
 */
export interface ApiMemoryResource {
    readonly id?: string;
    readonly url?: string;
    readonly modality?: string;
    readonly caption?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
    readonly metadata?: Record<string, unknown>;
}

/**
 * Raw API response for memory item.
 * @internal
 */
export interface ApiMemoryItem {
    readonly id?: string;
    readonly summary?: string;
    readonly content?: string;
    readonly memory_type?: string;
    readonly category_id?: string;
    readonly category_name?: string;
    readonly resource_id?: string;
    readonly score?: number;
    readonly created_at?: string;
    readonly updated_at?: string;
    readonly metadata?: Record<string, unknown>;
}

/**
 * Raw API response for memory category.
 * @internal
 */
export interface ApiMemoryCategory {
    readonly id?: string;
    readonly name?: string;
    readonly summary?: string;
    readonly description?: string;
    readonly content?: string;
    readonly item_count?: number;
    readonly score?: number;
    readonly created_at?: string;
    readonly updated_at?: string;
    readonly metadata?: Record<string, unknown>;
}

/**
 * Raw API response for task status.
 * @internal
 */
export interface ApiTaskStatus {
    readonly task_id: string;
    readonly status: string;
    readonly progress?: number;
    readonly message?: string;
    readonly result?: Record<string, unknown>;
    readonly created_at?: string;
    readonly updated_at?: string;
}

/**
 * Raw API response for memorize operation.
 * @internal
 */
export interface ApiMemorizeResponse {
    readonly task_id?: string;
    readonly resource?: ApiMemoryResource;
    readonly items?: readonly ApiMemoryItem[];
    readonly categories?: readonly ApiMemoryCategory[];
}

/**
 * Raw API response for retrieve operation.
 * @internal
 */
export interface ApiRetrieveResponse {
    readonly categories?: readonly ApiMemoryCategory[];
    readonly items?: readonly ApiMemoryItem[];
    readonly resources?: readonly ApiMemoryResource[];
    readonly next_step_query?: string;
}

/**
 * Raw API response for categories list.
 * @internal
 */
export interface ApiCategoriesResponse {
    readonly categories?: readonly ApiMemoryCategory[];
}

/**
 * Standard API error response format.
 * @internal
 */
export interface ApiErrorResponse {
    readonly error?: string;
    readonly message?: string;
    readonly detail?: string | readonly ApiValidationError[];
    readonly status_code?: number;
}

/**
 * Validation error detail from API.
 * @internal
 */
export interface ApiValidationError {
    readonly loc: readonly (string | number)[];
    readonly msg: string;
    readonly type: string;
}
