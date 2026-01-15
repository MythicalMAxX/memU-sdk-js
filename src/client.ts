/**
 * @fileoverview Main MemU Client implementation.
 *
 * This is the primary interface for interacting with the MemU Cloud API.
 * It provides async methods for all memory operations including memorization,
 * retrieval, and category management.
 *
 * @packageDocumentation
 * @module @memu/sdk
 */

import { HttpClient } from './http/client.js';
import { sleep } from './http/retry.js';
import {
    MemUClientError,
} from './errors/index.js';
import {
    TaskStatusEnum,
    type MemoryCategory,
    type MemoryItem,
    type MemoryResource,
    type MemorizeResult,
    type RetrieveResult,
    type TaskStatus,
    type ConversationMessage,
} from './types/models.js';
import type {
    MemUClientOptions,
    MemorizeOptions,
    RetrieveOptions,
    ListCategoriesOptions,
} from './types/requests.js';
import type {
    ApiMemorizeResponse,
    ApiRetrieveResponse,
    ApiCategoriesResponse,
    ApiTaskStatus,
    ApiMemoryItem,
    ApiMemoryCategory,
    ApiMemoryResource,
} from './types/responses.js';
import {
    validateApiKey,
    validateRequiredString,
    validateConversationInput,
    parseDate,
} from './utils/index.js';

/**
 * Default configuration values for the MemU client.
 */
const DEFAULTS = {
    BASE_URL: 'https://api.memu.so',
    TIMEOUT: 60000,
    MAX_RETRIES: 3,
    POLL_INTERVAL: 2000,
    COMPLETION_TIMEOUT: 300000,
} as const;

/**
 * API endpoint paths.
 * @internal
 */
const API_PATHS = {
    MEMORIZE: '/api/v3/memory/memorize',
    MEMORIZE_STATUS: '/api/v3/memory/memorize/status',
    RETRIEVE: '/api/v3/memory/retrieve',
    CATEGORIES: '/api/v3/memory/categories',
} as const;

/**
 * Main client for the MemU Cloud API.
 *
 * @remarks
 * The MemUClient provides a comprehensive interface for managing AI agent memory.
 * It supports both async and Promise-based usage patterns.
 *
 * Key features:
 * - **Memorization**: Extract and store structured memories from conversations
 * - **Retrieval**: Query memories using natural language or conversation context
 * - **Categories**: Organize memories into logical groupings
 * - **Task Tracking**: Monitor async memorization tasks
 *
 * @example Basic Usage
 * ```typescript
 * import { MemUClient } from '@memu/sdk';
 *
 * const client = new MemUClient({ apiKey: 'your_api_key' });
 *
 * // Memorize a conversation
 * const result = await client.memorize({
 *   conversation: [
 *     { role: 'user', content: 'I love Italian food' },
 *     { role: 'assistant', content: 'Great choice!' },
 *   ],
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 *   waitForCompletion: true,
 * });
 *
 * // Retrieve memories
 * const memories = await client.retrieve(
 *   'What food does the user like?',
 *   { userId: 'user_123', agentId: 'agent_456' }
 * );
 *
 * console.log(memories.items);
 *
 * // Clean up
 * await client.close();
 * ```
 *
 * @example With Using Block (auto cleanup)
 * ```typescript
 * await using client = new MemUClient({ apiKey: 'your_api_key' });
 *
 * const result = await client.memorize({ ... });
 * // Client is automatically closed when block exits
 * ```
 */
export class MemUClient {
    private readonly httpClient: HttpClient;
    private readonly options: Required<Omit<MemUClientOptions, 'enableCache' | 'cacheTtl'>>;
    private closed = false;

    /**
     * Creates a new MemUClient instance.
     *
     * @param options - Client configuration options
     * @throws Error if the API key is missing or invalid
     *
     * @example
     * ```typescript
     * const client = new MemUClient({
     *   apiKey: 'memu_your_api_key',
     *   baseUrl: 'https://api.memu.so', // Optional
     *   timeout: 60000,                  // Optional, default 60s
     *   maxRetries: 3,                   // Optional, default 3
     * });
     * ```
     */
    constructor(options: MemUClientOptions) {
        validateApiKey(options.apiKey);

        this.options = {
            apiKey: options.apiKey.trim(),
            baseUrl: (options.baseUrl ?? DEFAULTS.BASE_URL).replace(/\/+$/, ''),
            timeout: options.timeout ?? DEFAULTS.TIMEOUT,
            maxRetries: options.maxRetries ?? DEFAULTS.MAX_RETRIES,
        };

        this.httpClient = new HttpClient({
            baseUrl: this.options.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.options.apiKey}`,
            },
            timeout: this.options.timeout,
            retry: {
                maxRetries: this.options.maxRetries,
                baseDelay: 1000,
                maxDelay: 30000,
                backoffMultiplier: 2,
                jitter: true,
            },
        });
    }

    /**
     * Creates a new MemUClient instance.
     *
     * @remarks
     * Static factory method for creating client instances.
     * Equivalent to using the constructor directly.
     *
     * @param options - Client configuration options
     * @returns A new MemUClient instance
     */
    public static create(options: MemUClientOptions): MemUClient {
        return new MemUClient(options);
    }

    // =========================================================================
    // MEMORIZE API
    // =========================================================================

    /**
     * Memorize a conversation and extract structured memory.
     *
     * @remarks
     * This method processes a conversation to extract meaningful memory items
     * such as preferences, facts, relationships, and other structured information.
     *
     * The memorization process is asynchronous. By default, this method returns
     * immediately with a task ID. Set `waitForCompletion: true` to wait for
     * the task to complete and receive the full result.
     *
     * @param options - Memorization configuration
     * @returns Promise resolving to the memorization result
     * @throws MemUValidationError if the request is invalid
     * @throws MemUClientError for other API errors
     *
     * @example Async (fire and forget)
     * ```typescript
     * const result = await client.memorize({
     *   conversation: [
     *     { role: 'user', content: 'My favorite color is blue' },
     *   ],
     *   userId: 'user_123',
     *   agentId: 'agent_456',
     * });
     * console.log(`Task started: ${result.taskId}`);
     *
     * // Later, check status
     * const status = await client.getTaskStatus(result.taskId);
     * ```
     *
     * @example Sync (wait for completion)
     * ```typescript
     * const result = await client.memorize({
     *   conversation: [
     *     { role: 'user', content: 'I work at Acme Corp' },
     *   ],
     *   userId: 'user_123',
     *   agentId: 'agent_456',
     *   waitForCompletion: true,
     *   timeout: 120000, // 2 minutes
     * });
     *
     * console.log(`Extracted ${result.items.length} memory items`);
     * ```
     */
    public async memorize(options: MemorizeOptions): Promise<MemorizeResult> {
        this.ensureNotClosed();

        // Validate inputs
        validateRequiredString(options.userId, 'userId');
        validateRequiredString(options.agentId, 'agentId');
        validateConversationInput(options.conversation, options.conversationText);

        // Build request payload
        const payload: Record<string, unknown> = {
            user_id: options.userId,
            agent_id: options.agentId,
            user_name: options.userName ?? 'User',
            agent_name: options.agentName ?? 'Assistant',
        };

        if (options.conversation) {
            payload['conversation'] = options.conversation;
        } else if (options.conversationText) {
            payload['conversation_text'] = options.conversationText;
        }

        if (options.sessionDate) {
            payload['session_date'] = options.sessionDate;
        }

        // Make the request
        const response = await this.httpClient.post<ApiMemorizeResponse>(
            API_PATHS.MEMORIZE,
            payload,
        );

        // If waiting for completion, poll until done
        if (options.waitForCompletion && response.data.task_id) {
            return this.waitForMemorizeCompletion(
                response.data.task_id,
                options.pollInterval ?? DEFAULTS.POLL_INTERVAL,
                options.timeout ?? DEFAULTS.COMPLETION_TIMEOUT,
            );
        }

        // Return immediate result
        return this.transformMemorizeResponse(response.data);
    }

    /**
     * Get the status of a memorization task.
     *
     * @remarks
     * Use this method to check the progress of async memorization tasks.
     *
     * @param taskId - The task ID returned from memorize()
     * @returns Promise resolving to the current task status
     * @throws MemUNotFoundError if the task doesn't exist
     *
     * @example
     * ```typescript
     * const status = await client.getTaskStatus('task_abc123');
     *
     * if (status.status === TaskStatusEnum.COMPLETED) {
     *   console.log('Task finished!', status.result);
     * } else if (status.status === TaskStatusEnum.FAILED) {
     *   console.error('Task failed:', status.message);
     * } else {
     *   console.log(`Progress: ${status.progress}%`);
     * }
     * ```
     */
    public async getTaskStatus(taskId: string): Promise<TaskStatus> {
        this.ensureNotClosed();
        validateRequiredString(taskId, 'taskId');

        const response = await this.httpClient.get<ApiTaskStatus>(
            `${API_PATHS.MEMORIZE_STATUS}/${taskId}`,
        );

        return this.transformTaskStatus(response.data);
    }

    // =========================================================================
    // RETRIEVE API
    // =========================================================================

    /**
     * Retrieve relevant memories based on a query.
     *
     * @remarks
     * Searches the memory store to find memories relevant to the given query.
     * The query can be a simple string or a conversation context.
     *
     * Results are ranked by relevance and include memory items, categories,
     * and optionally the source resources.
     *
     * @param query - Search query string or conversation messages
     * @param options - Retrieval configuration
     * @returns Promise resolving to matching memories
     * @throws MemUValidationError if the request is invalid
     *
     * @example Simple query
     * ```typescript
     * const result = await client.retrieve(
     *   'What are the user\'s food preferences?',
     *   { userId: 'user_123', agentId: 'agent_456' }
     * );
     *
     * for (const item of result.items) {
     *   console.log(`[${item.memoryType}] ${item.summary} (score: ${item.score})`);
     * }
     * ```
     *
     * @example Conversation context query
     * ```typescript
     * const result = await client.retrieve(
     *   [
     *     { role: 'user', content: 'What do I usually order?' },
     *     { role: 'assistant', content: 'Let me check your preferences...' },
     *   ],
     *   { userId: 'user_123', agentId: 'agent_456' }
     * );
     * ```
     */
    public async retrieve(
        query: string | readonly ConversationMessage[],
        options: RetrieveOptions,
    ): Promise<RetrieveResult> {
        this.ensureNotClosed();

        // Validate inputs
        validateRequiredString(options.userId, 'userId');
        validateRequiredString(options.agentId, 'agentId');

        if (!query || (typeof query === 'string' && query.trim().length === 0)) {
            throw new Error('query is required');
        }

        // Build request payload
        // API expects:
        // - String query: { query: "string" }
        // - Conversation context: { query: "extracted from conversation", conversation: [...] }
        const payload: Record<string, unknown> = {
            user_id: options.userId,
            agent_id: options.agentId,
        };

        if (typeof query === 'string') {
            payload['query'] = query;
        } else {
            // For conversation arrays, extract the last user message as the query
            // and send the full conversation for context
            const lastUserMessage = [...query].reverse().find(m => m.role === 'user');
            payload['query'] = lastUserMessage?.content ?? query.map(m => `${m.role}: ${m.content}`).join('\n');
            payload['conversation'] = query;
        }

        const response = await this.httpClient.post<ApiRetrieveResponse>(
            API_PATHS.RETRIEVE,
            payload,
        );

        return this.transformRetrieveResponse(response.data);
    }

    // =========================================================================
    // CATEGORIES API
    // =========================================================================

    /**
     * List all memory categories for a user.
     *
     * @remarks
     * Categories organize related memories into logical groups such as
     * "preferences", "work_life", "relationships", etc.
     *
     * @param options - Category listing configuration
     * @returns Promise resolving to the list of categories
     *
     * @example
     * ```typescript
     * const categories = await client.listCategories({
     *   userId: 'user_123',
     *   agentId: 'agent_456',
     * });
     *
     * for (const cat of categories) {
     *   console.log(`${cat.name}: ${cat.itemCount} items`);
     * }
     * ```
     */
    public async listCategories(options: ListCategoriesOptions): Promise<readonly MemoryCategory[]> {
        this.ensureNotClosed();
        validateRequiredString(options.userId, 'userId');

        const payload: Record<string, unknown> = {
            user_id: options.userId,
        };

        if (options.agentId) {
            payload['agent_id'] = options.agentId;
        }

        const response = await this.httpClient.post<ApiCategoriesResponse>(
            API_PATHS.CATEGORIES,
            payload,
        );

        const categories = response.data.categories ?? [];
        return categories.map((cat) => this.transformCategory(cat));
    }

    // =========================================================================
    // RESOURCE MANAGEMENT
    // =========================================================================

    /**
     * Closes the client and releases resources.
     *
     * @remarks
     * Call this method when you're done using the client to clean up
     * any open connections. After calling close(), the client cannot
     * be used for further requests.
     *
     * @example
     * ```typescript
     * const client = new MemUClient({ apiKey: 'your_key' });
     * try {
     *   await client.memorize({ ... });
     * } finally {
     *   await client.close();
     * }
     * ```
     */
    public async close(): Promise<void> {
        this.closed = true;
        // HttpClient doesn't hold persistent connections with native fetch,
        // but this provides a clean shutdown hook for future optimizations
    }

    /**
     * Implements async disposable for automatic cleanup.
     *
     * @example
     * ```typescript
     * await using client = new MemUClient({ apiKey: 'your_key' });
     * // Client is automatically closed when the block exits
     * ```
     */
    public async [Symbol.asyncDispose](): Promise<void> {
        await this.close();
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Ensures the client has not been closed.
     * @internal
     */
    private ensureNotClosed(): void {
        if (this.closed) {
            throw new MemUClientError('Client has been closed');
        }
    }

    /**
     * Waits for a memorization task to complete.
     * @internal
     */
    private async waitForMemorizeCompletion(
        taskId: string,
        pollInterval: number,
        timeout: number,
    ): Promise<MemorizeResult> {
        const startTime = Date.now();

        while (true) {
            const status = await this.getTaskStatus(taskId);

            if (status.status === TaskStatusEnum.COMPLETED || status.status === TaskStatusEnum.SUCCESS) {
                // Extract result from task status
                if (status.result) {
                    const result = status.result as ApiMemorizeResponse;
                    return {
                        taskId,
                        resource: result.resource ? this.transformResource(result.resource as ApiMemoryResource) : undefined,
                        items: (result.items ?? []).map((item) => this.transformItem(item as ApiMemoryItem)),
                        categories: (result.categories ?? []).map((cat) => this.transformCategory(cat as ApiMemoryCategory)),
                    };
                }
                return { taskId, items: [], categories: [] };
            }

            if (status.status === TaskStatusEnum.FAILED) {
                throw new MemUClientError(
                    `Memorization task failed: ${status.message ?? 'Unknown error'}`,
                );
            }

            // Check timeout
            if (Date.now() - startTime > timeout) {
                throw new MemUClientError(
                    `Memorization task timed out after ${timeout}ms`,
                );
            }

            await sleep(pollInterval);
        }
    }

    /**
     * Transforms API memorize response to SDK format.
     * @internal
     */
    private transformMemorizeResponse(response: ApiMemorizeResponse): MemorizeResult {
        return {
            taskId: response.task_id,
            resource: response.resource ? this.transformResource(response.resource) : undefined,
            items: (response.items ?? []).map((item) => this.transformItem(item)),
            categories: (response.categories ?? []).map((cat) => this.transformCategory(cat)),
        };
    }

    /**
     * Transforms API retrieve response to SDK format.
     * @internal
     */
    private transformRetrieveResponse(response: ApiRetrieveResponse): RetrieveResult {
        return {
            categories: (response.categories ?? []).map((cat) => this.transformCategory(cat)),
            items: (response.items ?? []).map((item) => this.transformItem(item)),
            resources: (response.resources ?? []).map((res) => this.transformResource(res)),
            nextStepQuery: response.next_step_query,
        };
    }

    /**
     * Transforms API task status to SDK format.
     * @internal
     */
    private transformTaskStatus(response: ApiTaskStatus): TaskStatus {
        return {
            taskId: response.task_id,
            status: response.status as TaskStatusEnum,
            progress: response.progress,
            message: response.message,
            result: response.result,
            createdAt: parseDate(response.created_at),
            updatedAt: parseDate(response.updated_at),
        };
    }

    /**
     * Transforms API memory item to SDK format.
     * @internal
     */
    private transformItem(item: ApiMemoryItem): MemoryItem {
        return {
            id: item.id,
            summary: item.summary,
            content: item.content,
            memoryType: item.memory_type,
            categoryId: item.category_id,
            categoryName: item.category_name,
            resourceId: item.resource_id,
            score: item.score,
            createdAt: parseDate(item.created_at),
            updatedAt: parseDate(item.updated_at),
            metadata: item.metadata,
        };
    }

    /**
     * Transforms API memory category to SDK format.
     * @internal
     */
    private transformCategory(category: ApiMemoryCategory): MemoryCategory {
        return {
            id: category.id,
            name: category.name,
            summary: category.summary,
            description: category.description,
            content: category.content,
            itemCount: category.item_count,
            score: category.score,
            createdAt: parseDate(category.created_at),
            updatedAt: parseDate(category.updated_at),
            metadata: category.metadata,
        };
    }

    /**
     * Transforms API memory resource to SDK format.
     * @internal
     */
    private transformResource(resource: ApiMemoryResource): MemoryResource {
        return {
            id: resource.id,
            url: resource.url,
            modality: resource.modality as MemoryResource['modality'],
            caption: resource.caption,
            createdAt: parseDate(resource.created_at),
            updatedAt: parseDate(resource.updated_at),
            metadata: resource.metadata,
        };
    }
}
