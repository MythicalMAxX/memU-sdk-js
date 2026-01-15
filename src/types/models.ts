/**
 * @fileoverview Core data model interfaces for the MemU SDK.
 *
 * These interfaces represent the data structures returned by the MemU Cloud API v3.
 * All properties use camelCase in JavaScript, automatically mapped from the API's snake_case.
 *
 * @packageDocumentation
 * @module @memu/sdk/types
 */

/**
 * Status values for asynchronous memorization tasks.
 *
 * @remarks
 * Tasks progress through these states:
 * - `PENDING` → Task queued but not started
 * - `PROCESSING` → Task actively running
 * - `COMPLETED` / `SUCCESS` → Task finished successfully
 * - `FAILED` → Task encountered an error
 */
export enum TaskStatusEnum {
    /** Task is queued and waiting to be processed */
    PENDING = 'PENDING',
    /** Task is currently being processed */
    PROCESSING = 'PROCESSING',
    /** Task completed successfully */
    COMPLETED = 'COMPLETED',
    /** Task completed successfully (alias for COMPLETED) */
    SUCCESS = 'SUCCESS',
    /** Task failed with an error */
    FAILED = 'FAILED',
}

/**
 * Modality types for memory resources.
 *
 * @remarks
 * Indicates the source type of a memory resource.
 */
export type ResourceModality =
    | 'conversation'
    | 'document'
    | 'image'
    | 'video'
    | 'audio';

/**
 * Common memory type classifications.
 *
 * @remarks
 * Memory items are categorized by their semantic type.
 * Custom types beyond this list are also supported.
 */
export type MemoryType =
    | 'preference'
    | 'skill'
    | 'opinion'
    | 'habit'
    | 'relationship'
    | 'event'
    | 'profile'
    | 'goal'
    | 'fact'
    | string;

/**
 * Represents a raw resource stored in MemU.
 *
 * @remarks
 * Resources are the source materials (conversations, documents, images, etc.)
 * from which memory items are extracted. Each resource can contain multiple
 * memory items across different categories.
 *
 * @example
 * ```typescript
 * const resource: MemoryResource = {
 *   id: 'res_abc123',
 *   url: 'https://storage.memu.so/conversations/xyz.json',
 *   modality: 'conversation',
 *   caption: 'User onboarding conversation',
 *   createdAt: new Date('2024-01-15T10:30:00Z'),
 * };
 * ```
 */
export interface MemoryResource {
    /** Unique identifier for the resource */
    readonly id?: string;
    /** URL or path to the resource content */
    readonly url?: string;
    /** Type of resource: conversation, document, image, video, audio */
    readonly modality?: ResourceModality;
    /** Human-readable caption or description */
    readonly caption?: string;
    /** Timestamp when the resource was created */
    readonly createdAt?: Date;
    /** Timestamp of the last update */
    readonly updatedAt?: Date;
    /** Additional metadata key-value pairs */
    readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Represents a discrete memory unit extracted from resources.
 *
 * @remarks
 * Memory items are individual pieces of information such as preferences,
 * skills, opinions, habits, relationships, etc. They are extracted from
 * resources and organized into categories for efficient retrieval.
 *
 * @example
 * ```typescript
 * const item: MemoryItem = {
 *   id: 'item_xyz789',
 *   summary: 'Prefers vegetarian cuisine',
 *   content: 'User mentioned they follow a vegetarian diet for health reasons',
 *   memoryType: 'preference',
 *   categoryId: 'cat_food',
 *   categoryName: 'Food & Dining',
 *   score: 0.95,
 * };
 * ```
 */
export interface MemoryItem {
    /** Unique identifier for the memory item */
    readonly id?: string;
    /** Brief summary or description of the memory */
    readonly summary?: string;
    /** Full content text of the memory item */
    readonly content?: string;
    /** Classification type: preference, skill, opinion, habit, etc. */
    readonly memoryType?: MemoryType;
    /** ID of the category this item belongs to */
    readonly categoryId?: string;
    /** Name of the category this item belongs to */
    readonly categoryName?: string;
    /** ID of the source resource */
    readonly resourceId?: string;
    /** Relevance score (0-1) when returned from retrieve operations */
    readonly score?: number;
    /** Timestamp when the item was created */
    readonly createdAt?: Date;
    /** Timestamp of the last update */
    readonly updatedAt?: Date;
    /** Additional metadata key-value pairs */
    readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Represents an aggregated memory category.
 *
 * @remarks
 * Categories organize related memory items and provide summaries of clustered
 * information. They help structure memories into logical groups like
 * "preferences", "work_life", "relationships", etc.
 *
 * @example
 * ```typescript
 * const category: MemoryCategory = {
 *   id: 'cat_prefs',
 *   name: 'preferences',
 *   summary: 'User food, entertainment, and lifestyle preferences',
 *   itemCount: 15,
 *   score: 0.88,
 * };
 * ```
 */
export interface MemoryCategory {
    /** Unique identifier for the category */
    readonly id?: string;
    /** Category name (e.g., 'preferences', 'work_life') */
    readonly name?: string;
    /** Summary of the category content */
    readonly summary?: string;
    /** Detailed description of the category */
    readonly description?: string;
    /** Full aggregated content of the category */
    readonly content?: string;
    /** Number of memory items in this category */
    readonly itemCount?: number;
    /** Relevance score (0-1) when returned from retrieve operations */
    readonly score?: number;
    /** Timestamp when the category was created */
    readonly createdAt?: Date;
    /** Timestamp of the last update */
    readonly updatedAt?: Date;
    /** Additional metadata key-value pairs */
    readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Status information for an asynchronous memorization task.
 *
 * @remarks
 * After initiating a memorization request, you receive a task ID that can be
 * polled to check progress. This interface represents the current state of
 * that task.
 *
 * @example
 * ```typescript
 * const status: TaskStatus = {
 *   taskId: 'task_mem_123',
 *   status: TaskStatusEnum.PROCESSING,
 *   progress: 45,
 *   message: 'Extracting memory items...',
 * };
 * ```
 */
export interface TaskStatus {
    /** Unique identifier for the task */
    readonly taskId: string;
    /** Current status of the task */
    readonly status: TaskStatusEnum;
    /** Progress percentage (0-100), if available */
    readonly progress?: number;
    /** Human-readable status message or error description */
    readonly message?: string;
    /** Task result data when completed successfully */
    readonly result?: Readonly<Record<string, unknown>>;
    /** Timestamp when the task was created */
    readonly createdAt?: Date;
    /** Timestamp of the last status update */
    readonly updatedAt?: Date;
}

/**
 * Result of a memorization operation.
 *
 * @remarks
 * Contains either a task ID for async tracking or the full result for
 * synchronous operations (when `waitForCompletion` is true).
 *
 * @example
 * ```typescript
 * const result: MemorizeResult = {
 *   taskId: 'task_mem_456',
 *   items: [
 *     { id: 'item_1', summary: 'Loves Italian food', memoryType: 'preference' },
 *   ],
 *   categories: [
 *     { id: 'cat_food', name: 'Food Preferences', itemCount: 3 },
 *   ],
 * };
 * ```
 */
export interface MemorizeResult {
    /** Task ID for tracking async memorization */
    readonly taskId?: string;
    /** The created resource (if applicable) */
    readonly resource?: MemoryResource;
    /** Memory items extracted from the conversation */
    readonly items: readonly MemoryItem[];
    /** Categories that were created or updated */
    readonly categories: readonly MemoryCategory[];
}

/**
 * Result of a memory retrieval operation.
 *
 * @remarks
 * Contains relevant categories, items, and resources matching the query.
 * Results are sorted by relevance score in descending order.
 *
 * @example
 * ```typescript
 * const result: RetrieveResult = {
 *   categories: [{ name: 'preferences', score: 0.92 }],
 *   items: [{ summary: 'Prefers morning meetings', score: 0.88 }],
 *   resources: [],
 *   nextStepQuery: 'What are their specific meeting time preferences?',
 * };
 * ```
 */
export interface RetrieveResult {
    /** Relevant categories matching the query */
    readonly categories: readonly MemoryCategory[];
    /** Relevant memory items matching the query */
    readonly items: readonly MemoryItem[];
    /** Related raw resources */
    readonly resources: readonly MemoryResource[];
    /** Suggested follow-up query for deeper retrieval */
    readonly nextStepQuery?: string;
}

/**
 * A single message in a conversation.
 *
 * @remarks
 * Used when passing conversation history to memorize or retrieve methods.
 */
export interface ConversationMessage {
    /** Role of the message sender: 'user', 'assistant', or 'system' */
    readonly role: 'user' | 'assistant' | 'system';
    /** Content of the message */
    readonly content: string;
}
