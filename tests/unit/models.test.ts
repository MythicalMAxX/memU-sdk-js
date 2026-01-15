/**
 * Unit tests for data models.
 */

import { TaskStatusEnum } from '../../src/types/models.js';
import type {
    MemoryItem,
    MemoryCategory,
    MemoryResource,
    TaskStatus,
    MemorizeResult,
    RetrieveResult,
    ConversationMessage,
} from '../../src/types/models.js';

describe('TaskStatusEnum', () => {
    it('should have PENDING value', () => {
        expect(TaskStatusEnum.PENDING).toBe('PENDING');
    });

    it('should have PROCESSING value', () => {
        expect(TaskStatusEnum.PROCESSING).toBe('PROCESSING');
    });

    it('should have COMPLETED value', () => {
        expect(TaskStatusEnum.COMPLETED).toBe('COMPLETED');
    });

    it('should have SUCCESS value', () => {
        expect(TaskStatusEnum.SUCCESS).toBe('SUCCESS');
    });

    it('should have FAILED value', () => {
        expect(TaskStatusEnum.FAILED).toBe('FAILED');
    });
});

describe('MemoryItem interface', () => {
    it('should allow creating minimal item', () => {
        const item: MemoryItem = {};
        expect(item).toBeDefined();
    });

    it('should allow creating full item', () => {
        const item: MemoryItem = {
            id: 'item_123',
            summary: 'User prefers pizza',
            content: 'The user mentioned they love pizza',
            memoryType: 'preference',
            categoryId: 'cat_food',
            categoryName: 'Food Preferences',
            resourceId: 'res_001',
            score: 0.95,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: { source: 'chat' },
        };
        expect(item.id).toBe('item_123');
        expect(item.memoryType).toBe('preference');
        expect(item.score).toBe(0.95);
    });
});

describe('MemoryCategory interface', () => {
    it('should allow creating minimal category', () => {
        const category: MemoryCategory = {};
        expect(category).toBeDefined();
    });

    it('should allow creating full category', () => {
        const category: MemoryCategory = {
            id: 'cat_123',
            name: 'preferences',
            summary: 'User preferences and likes',
            description: 'Collection of user preferences',
            content: 'Detailed content here',
            itemCount: 15,
            score: 0.88,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: { priority: 'high' },
        };
        expect(category.name).toBe('preferences');
        expect(category.itemCount).toBe(15);
    });
});

describe('MemoryResource interface', () => {
    it('should allow creating minimal resource', () => {
        const resource: MemoryResource = {};
        expect(resource).toBeDefined();
    });

    it('should allow creating full resource', () => {
        const resource: MemoryResource = {
            id: 'res_123',
            url: 'https://storage.memu.so/file.json',
            modality: 'conversation',
            caption: 'Chat session from yesterday',
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: { sessionId: 'sess_001' },
        };
        expect(resource.modality).toBe('conversation');
    });
});

describe('TaskStatus interface', () => {
    it('should require taskId and status', () => {
        const status: TaskStatus = {
            taskId: 'task_123',
            status: TaskStatusEnum.PROCESSING,
        };
        expect(status.taskId).toBe('task_123');
        expect(status.status).toBe(TaskStatusEnum.PROCESSING);
    });

    it('should allow optional fields', () => {
        const status: TaskStatus = {
            taskId: 'task_123',
            status: TaskStatusEnum.COMPLETED,
            progress: 100,
            message: 'Task completed successfully',
            result: { items: [] },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        expect(status.progress).toBe(100);
        expect(status.result).toEqual({ items: [] });
    });
});

describe('MemorizeResult interface', () => {
    it('should have default arrays', () => {
        const result: MemorizeResult = {
            items: [],
            categories: [],
        };
        expect(result.items).toEqual([]);
        expect(result.categories).toEqual([]);
    });

    it('should allow full result', () => {
        const result: MemorizeResult = {
            taskId: 'task_123',
            resource: { id: 'res_1' },
            items: [{ id: 'item_1', summary: 'Test' }],
            categories: [{ id: 'cat_1', name: 'test' }],
        };
        expect(result.taskId).toBe('task_123');
        expect(result.items).toHaveLength(1);
        expect(result.categories).toHaveLength(1);
    });
});

describe('RetrieveResult interface', () => {
    it('should have default arrays', () => {
        const result: RetrieveResult = {
            categories: [],
            items: [],
            resources: [],
        };
        expect(result.categories).toEqual([]);
        expect(result.items).toEqual([]);
        expect(result.resources).toEqual([]);
    });

    it('should allow optional nextStepQuery', () => {
        const result: RetrieveResult = {
            categories: [],
            items: [],
            resources: [],
            nextStepQuery: 'Follow up on preferences',
        };
        expect(result.nextStepQuery).toBe('Follow up on preferences');
    });
});

describe('ConversationMessage interface', () => {
    it('should require role and content', () => {
        const message: ConversationMessage = {
            role: 'user',
            content: 'Hello, assistant!',
        };
        expect(message.role).toBe('user');
        expect(message.content).toBe('Hello, assistant!');
    });

    it('should allow assistant role', () => {
        const message: ConversationMessage = {
            role: 'assistant',
            content: 'Hello! How can I help?',
        };
        expect(message.role).toBe('assistant');
    });

    it('should allow system role', () => {
        const message: ConversationMessage = {
            role: 'system',
            content: 'You are a helpful assistant',
        };
        expect(message.role).toBe('system');
    });
});
