/**
 * MemU SDK - Basic Usage Example (TypeScript)
 *
 * Demonstrates core SDK functionality:
 * - Client initialization with configuration options
 * - Memorizing conversations (async and sync modes)
 * - Retrieving memories with queries
 * - Listing memory categories
 *
 * Prerequisites:
 *   Set MEMU_API_KEY environment variable
 *
 * Usage:
 *   npx tsx examples/basic-usage.ts
 */

import { MemUClient, TaskStatusEnum, isMemUError } from '../src/index.js';

const API_KEY = process.env['MEMU_API_KEY'];
const USER_ID = 'example_user_ts';
const AGENT_ID = 'example_agent_ts';

if (!API_KEY) {
    console.error('[ERROR] MEMU_API_KEY environment variable is required');
    process.exit(1);
}

async function main(): Promise<void> {
    console.log('MemU SDK - TypeScript Example');
    console.log('==============================\n');

    const client = new MemUClient({
        apiKey: API_KEY,
        timeout: 60000,
        maxRetries: 3,
    });

    try {
        // -----------------------------------------------------------------
        // 1. Memorize a conversation
        // -----------------------------------------------------------------
        console.log('[STEP 1] Memorize conversation');

        const memorizeResult = await client.memorize({
            conversation: [
                { role: 'user', content: 'I just moved to San Francisco last month.' },
                { role: 'assistant', content: 'Welcome to SF! How are you finding it?' },
                { role: 'user', content: 'I love it! I work as a software engineer at a startup.' },
                { role: 'assistant', content: 'What technologies do you work with?' },
                { role: 'user', content: 'Mostly TypeScript and React for frontend, Go for backend.' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            userName: 'Alex',
            agentName: 'Aria',
            waitForCompletion: true,
            pollInterval: 2000,
            timeout: 120000,
        });

        console.log('[INFO] Task ID: %s', memorizeResult.taskId);
        console.log('[INFO] Items extracted: %d', memorizeResult.items.length);
        console.log('[INFO] Categories updated: %d\n', memorizeResult.categories.length);

        // Display extracted memories
        if (memorizeResult.items.length > 0) {
            console.log('[INFO] Extracted items:');
            for (const item of memorizeResult.items) {
                console.log('       [%s] %s', item.memoryType, item.summary);
            }
            console.log('');
        }

        // -----------------------------------------------------------------
        // 2. Retrieve memories with a query
        // -----------------------------------------------------------------
        console.log('[STEP 2] Retrieve memories');

        const workMemories = await client.retrieve(
            'What does the user do for work and what technologies are they interested in?',
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('[INFO] Items found: %d', workMemories.items.length);

        if (workMemories.items.length > 0) {
            console.log('[INFO] Results:');
            for (const item of workMemories.items) {
                const score = item.score ? ` (score: ${item.score.toFixed(2)})` : '';
                console.log('       [%s] %s%s', item.memoryType, item.summary, score);
            }
            console.log('');
        }

        // -----------------------------------------------------------------
        // 3. Retrieve with conversation context
        // -----------------------------------------------------------------
        console.log('[STEP 3] Retrieve with conversation context');

        const hobbyMemories = await client.retrieve(
            [
                { role: 'user', content: 'What do I like to do on weekends?' },
                { role: 'assistant', content: 'Let me check your preferences...' },
            ],
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('[INFO] Items found: %d\n', hobbyMemories.items.length);

        // -----------------------------------------------------------------
        // 4. List all categories
        // -----------------------------------------------------------------
        console.log('[STEP 4] List categories');

        const categories = await client.listCategories({
            userId: USER_ID,
            agentId: AGENT_ID,
        });

        console.log('[INFO] Categories: %d', categories.length);

        if (categories.length > 0) {
            for (const cat of categories) {
                const count = cat.itemCount ? ` (${cat.itemCount} items)` : '';
                console.log('       - %s%s', cat.name, count);
            }
            console.log('');
        }

        console.log('[SUCCESS] Example completed');

    } catch (error) {
        if (isMemUError(error)) {
            console.error('[ERROR] MemU API Error: %s', error.message);
            if (error.statusCode) {
                console.error('[ERROR] Status Code: %d', error.statusCode);
            }
        } else {
            console.error('[ERROR] Unexpected error:', error);
        }
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
