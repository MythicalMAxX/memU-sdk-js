/**
 * @fileoverview Request payload types for the MemU Cloud API.
 *
 * These interfaces define the structure of request payloads sent to the API.
 * All properties use camelCase in JavaScript but are automatically converted
 * to snake_case when sent to the API.
 *
 * @packageDocumentation
 * @module @memu/sdk/types
 */

import type { ConversationMessage } from './models.js';

/**
 * Options for creating a MemU client instance.
 *
 * @example
 * ```typescript
 * const options: MemUClientOptions = {
 *   apiKey: 'memu_your_api_key',
 *   baseUrl: 'https://api.memu.so',
 *   timeout: 60000,
 *   maxRetries: 3,
 * };
 * ```
 */
export interface MemUClientOptions {
    /**
     * Your MemU API key.
     *
     * @remarks
     * Get your API key from https://memu.so/dashboard
     */
    readonly apiKey: string;

    /**
     * Base URL for the MemU API.
     *
     * @defaultValue 'https://api.memu.so'
     */
    readonly baseUrl?: string;

    /**
     * Request timeout in milliseconds.
     *
     * @defaultValue 60000 (60 seconds)
     */
    readonly timeout?: number;

    /**
     * Maximum number of retry attempts for failed requests.
     *
     * @remarks
     * Retries use exponential backoff with jitter.
     * Only retries on 429 (rate limit), 5xx (server errors), and network failures.
     *
     * @defaultValue 3
     */
    readonly maxRetries?: number;

    /**
     * Enable request/response caching.
     *
     * @remarks
     * When enabled, identical retrieve requests within the cache TTL
     * will return cached results instead of making new API calls.
     *
     * @defaultValue false
     */
    readonly enableCache?: boolean;

    /**
     * Cache TTL in milliseconds.
     *
     * @defaultValue 300000 (5 minutes)
     */
    readonly cacheTtl?: number;
}

/**
 * Options for the memorize operation.
 *
 * @example
 * ```typescript
 * const options: MemorizeOptions = {
 *   conversation: [
 *     { role: 'user', content: 'I love Italian food' },
 *     { role: 'assistant', content: 'That is great!' },
 *   ],
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 *   waitForCompletion: true,
 * };
 * ```
 */
export interface MemorizeOptions {
    /**
     * Structured conversation messages to memorize.
     *
     * @remarks
     * Either `conversation` or `conversationText` must be provided.
     */
    readonly conversation?: readonly ConversationMessage[];

    /**
     * Raw conversation text to memorize.
     *
     * @remarks
     * Alternative to structured `conversation`. Useful for pre-formatted text.
     * Either `conversation` or `conversationText` must be provided.
     */
    readonly conversationText?: string;

    /**
     * User ID for scoping the memory.
     *
     * @remarks
     * Required. All memories are scoped to a specific user.
     */
    readonly userId: string;

    /**
     * Agent ID for scoping the memory.
     *
     * @remarks
     * Required. Allows different agents to maintain separate memory spaces.
     */
    readonly agentId: string;

    /**
     * Display name for the user in the conversation.
     *
     * @defaultValue 'User'
     */
    readonly userName?: string;

    /**
     * Display name for the agent in the conversation.
     *
     * @defaultValue 'Assistant'
     */
    readonly agentName?: string;

    /**
     * Session date in ISO 8601 format.
     *
     * @remarks
     * Optional. Helps with temporal context for memory extraction.
     */
    readonly sessionDate?: string;

    /**
     * Wait for the memorization task to complete.
     *
     * @remarks
     * When true, the method will poll the task status until completion
     * and return the full result. When false, returns immediately with
     * a task ID for async tracking.
     *
     * @defaultValue false
     */
    readonly waitForCompletion?: boolean;

    /**
     * Polling interval in milliseconds when waiting for completion.
     *
     * @defaultValue 2000 (2 seconds)
     */
    readonly pollInterval?: number;

    /**
     * Maximum time to wait for completion in milliseconds.
     *
     * @remarks
     * Only applies when `waitForCompletion` is true.
     *
     * @defaultValue 300000 (5 minutes)
     */
    readonly timeout?: number;
}

/**
 * Options for the retrieve operation.
 *
 * @example
 * ```typescript
 * const options: RetrieveOptions = {
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 * };
 * ```
 */
export interface RetrieveOptions {
    /**
     * User ID for scoping the retrieval.
     *
     * @remarks
     * Required. Retrieves only memories for this specific user.
     */
    readonly userId: string;

    /**
     * Agent ID for scoping the retrieval.
     *
     * @remarks
     * Required. Retrieves only memories for this specific agent.
     */
    readonly agentId: string;
}

/**
 * Options for listing categories.
 *
 * @example
 * ```typescript
 * const options: ListCategoriesOptions = {
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 * };
 * ```
 */
export interface ListCategoriesOptions {
    /**
     * User ID for scoping the category list.
     *
     * @remarks
     * Required. Lists categories only for this specific user.
     */
    readonly userId: string;

    /**
     * Agent ID for scoping the category list.
     *
     * @remarks
     * Optional. When provided, lists categories for this specific agent.
     */
    readonly agentId?: string;
}

/**
 * Internal request payload for the memorize API endpoint.
 * @internal
 */
export interface MemorizeRequestPayload {
    readonly user_id: string;
    readonly agent_id: string;
    readonly user_name: string;
    readonly agent_name: string;
    readonly conversation?: readonly ConversationMessage[];
    readonly conversation_text?: string;
    readonly session_date?: string;
}

/**
 * Internal request payload for the retrieve API endpoint.
 * @internal
 */
export interface RetrieveRequestPayload {
    readonly user_id: string;
    readonly agent_id: string;
    readonly query: string | readonly ConversationMessage[];
}

/**
 * Internal request payload for the categories API endpoint.
 * @internal
 */
export interface CategoriesRequestPayload {
    readonly user_id: string;
    readonly agent_id?: string;
}
