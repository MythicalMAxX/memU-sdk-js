/**
 * Unit tests for MemUClient initialization and configuration.
 */

import { MemUClient } from '../../src/client.js';

describe('MemUClient', () => {
    describe('constructor', () => {
        it('should initialize with valid API key', () => {
            const client = new MemUClient({ apiKey: 'test_api_key' });
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should trim whitespace from API key', () => {
            const client = new MemUClient({ apiKey: '  test_api_key  ' });
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should throw error for empty API key', () => {
            expect(() => new MemUClient({ apiKey: '' })).toThrow('API key is required');
        });

        it('should throw error for whitespace-only API key', () => {
            expect(() => new MemUClient({ apiKey: '   ' })).toThrow('API key is required');
        });

        it('should use default base URL', () => {
            const client = new MemUClient({ apiKey: 'test_key' });
            // Client should be created successfully with default URL
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should accept custom base URL', () => {
            const client = new MemUClient({
                apiKey: 'test_key',
                baseUrl: 'https://custom.api.memu.so',
            });
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should strip trailing slash from base URL', () => {
            const client = new MemUClient({
                apiKey: 'test_key',
                baseUrl: 'https://api.memu.so/',
            });
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should accept custom timeout', () => {
            const client = new MemUClient({
                apiKey: 'test_key',
                timeout: 30000,
            });
            expect(client).toBeInstanceOf(MemUClient);
        });

        it('should accept custom max retries', () => {
            const client = new MemUClient({
                apiKey: 'test_key',
                maxRetries: 5,
            });
            expect(client).toBeInstanceOf(MemUClient);
        });
    });

    describe('static create', () => {
        it('should create instance via factory method', () => {
            const client = MemUClient.create({ apiKey: 'test_key' });
            expect(client).toBeInstanceOf(MemUClient);
        });
    });

    describe('close', () => {
        it('should close without error', async () => {
            const client = new MemUClient({ apiKey: 'test_key' });
            await expect(client.close()).resolves.toBeUndefined();
        });

        it('should prevent further requests after close', async () => {
            const client = new MemUClient({ apiKey: 'test_key' });
            await client.close();

            await expect(
                client.memorize({
                    conversation: [{ role: 'user', content: 'test' }],
                    userId: 'user_123',
                    agentId: 'agent_456',
                }),
            ).rejects.toThrow('Client has been closed');
        });
    });

    describe('async disposable', () => {
        it('should support Symbol.asyncDispose', () => {
            const client = new MemUClient({ apiKey: 'test_key' });
            expect(typeof client[Symbol.asyncDispose]).toBe('function');
        });
    });
});

describe('MemUClient input validation', () => {
    let client: MemUClient;

    beforeEach(() => {
        client = new MemUClient({ apiKey: 'test_key' });
    });

    afterEach(async () => {
        await client.close();
    });

    describe('memorize', () => {
        it('should throw error for empty userId', async () => {
            await expect(
                client.memorize({
                    conversation: [{ role: 'user', content: 'test' }],
                    userId: '',
                    agentId: 'agent_456',
                }),
            ).rejects.toThrow('userId is required');
        });

        it('should throw error for empty agentId', async () => {
            await expect(
                client.memorize({
                    conversation: [{ role: 'user', content: 'test' }],
                    userId: 'user_123',
                    agentId: '',
                }),
            ).rejects.toThrow('agentId is required');
        });

        it('should throw error when neither conversation nor conversationText provided', async () => {
            await expect(
                client.memorize({
                    userId: 'user_123',
                    agentId: 'agent_456',
                } as any),
            ).rejects.toThrow('Either conversation or conversationText must be provided');
        });
    });

    describe('retrieve', () => {
        it('should throw error for empty query', async () => {
            await expect(
                client.retrieve('', { userId: 'user_123', agentId: 'agent_456' }),
            ).rejects.toThrow('query is required');
        });

        it('should throw error for empty userId', async () => {
            await expect(
                client.retrieve('test query', { userId: '', agentId: 'agent_456' }),
            ).rejects.toThrow('userId is required');
        });
    });

    describe('listCategories', () => {
        it('should throw error for empty userId', async () => {
            await expect(
                client.listCategories({ userId: '' }),
            ).rejects.toThrow('userId is required');
        });
    });

    describe('getTaskStatus', () => {
        it('should throw error for empty taskId', async () => {
            await expect(client.getTaskStatus('')).rejects.toThrow('taskId is required');
        });
    });
});
