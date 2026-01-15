/**
 * MemU SDK - Basic Usage Example (JavaScript)
 *
 * Demonstrates core SDK functionality:
 * - Client initialization with configuration options
 * - Memorizing conversations (async and sync modes)
 * - Retrieving memories with queries
 * - Listing memory categories
 * - Task status polling
 *
 * Prerequisites:
 *   1. Build the SDK: npm run build
 *   2. Set MEMU_API_KEY environment variable
 *
 * Usage:
 *   node examples/basic-usage.js
 */

const API_KEY = process.env.MEMU_API_KEY;
const USER_ID = 'example_user_' + Date.now();
const AGENT_ID = 'example_agent';

if (!API_KEY) {
    console.error('[ERROR] MEMU_API_KEY environment variable is required');
    console.error('        Set it with: export MEMU_API_KEY=your_api_key');
    process.exit(1);
}

async function main() {
    console.log('MemU SDK - Basic Usage Example');
    console.log('================================\n');

    const { MemUClient, isMemUError } = await import('../dist/esm/index.js');

    // Initialize client with configuration
    const client = new MemUClient({
        apiKey: API_KEY,
        timeout: 60000,
        maxRetries: 3,
    });

    console.log('[INFO] Client initialized');
    console.log('[INFO] User ID: %s', USER_ID);
    console.log('[INFO] Agent ID: %s\n', AGENT_ID);

    try {
        // -----------------------------------------------------------------
        // 1. Memorize - Async Mode (returns immediately with task ID)
        // -----------------------------------------------------------------
        console.log('[STEP 1] Memorize conversation (async mode)');

        const asyncResult = await client.memorize({
            conversation: [
                { role: 'user', content: 'My name is Alex and I work as a software engineer.' },
                { role: 'assistant', content: 'Nice to meet you, Alex!' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            userName: 'Alex',
            agentName: 'Assistant',
            waitForCompletion: false,
        });

        console.log('[INFO] Task ID: %s', asyncResult.taskId);
        console.log('[INFO] Status: Task queued for processing\n');

        // -----------------------------------------------------------------
        // 2. Memorize - Sync Mode (waits for completion)
        // -----------------------------------------------------------------
        console.log('[STEP 2] Memorize conversation (sync mode)');

        const syncResult = await client.memorize({
            conversation: [
                { role: 'user', content: 'I enjoy hiking and reading science fiction.' },
                { role: 'assistant', content: 'Those are great hobbies!' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: true,
            pollInterval: 2000,
            timeout: 120000,
        });

        console.log('[INFO] Task ID: %s', syncResult.taskId);
        console.log('[INFO] Items extracted: %d', syncResult.items.length);
        console.log('[INFO] Categories updated: %d\n', syncResult.categories.length);

        // Allow time for async task to complete
        console.log('[INFO] Waiting for background processing...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // -----------------------------------------------------------------
        // 3. Retrieve memories with string query
        // -----------------------------------------------------------------
        console.log('[STEP 3] Retrieve memories (string query)');

        const queryResult = await client.retrieve(
            'What are the user hobbies and interests?',
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('[INFO] Items found: %d', queryResult.items.length);
        console.log('[INFO] Categories found: %d', queryResult.categories.length);

        if (queryResult.items.length > 0) {
            console.log('[INFO] Top results:');
            queryResult.items.slice(0, 3).forEach((item, index) => {
                console.log('       %d. [%s] %s', index + 1, item.memoryType, item.content || item.summary);
            });
        }
        console.log('');

        // -----------------------------------------------------------------
        // 4. Retrieve with conversation context
        // -----------------------------------------------------------------
        console.log('[STEP 4] Retrieve memories (conversation context)');

        const contextResult = await client.retrieve(
            [
                { role: 'user', content: 'What do you know about my job?' },
            ],
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('[INFO] Items found: %d\n', contextResult.items.length);

        // -----------------------------------------------------------------
        // 5. List categories
        // -----------------------------------------------------------------
        console.log('[STEP 5] List memory categories');

        const categories = await client.listCategories({
            userId: USER_ID,
            agentId: AGENT_ID,
        });

        console.log('[INFO] Categories: %d', categories.length);
        categories.forEach(cat => {
            console.log('       - %s%s', cat.name, cat.itemCount ? ` (${cat.itemCount} items)` : '');
        });
        console.log('');

        // -----------------------------------------------------------------
        // 6. Check task status
        // -----------------------------------------------------------------
        console.log('[STEP 6] Check task status');

        if (asyncResult.taskId) {
            const status = await client.getTaskStatus(asyncResult.taskId);
            console.log('[INFO] Task: %s', asyncResult.taskId);
            console.log('[INFO] Status: %s', status.status);
        }
        console.log('');

        console.log('[SUCCESS] All operations completed');

    } catch (error) {
        if (isMemUError(error)) {
            console.error('[ERROR] API Error: %s', error.message);
            if (error.statusCode) {
                console.error('[ERROR] Status Code: %d', error.statusCode);
            }
        } else {
            console.error('[ERROR] Unexpected error:', error);
        }
        process.exit(1);
    } finally {
        await client.close();
        console.log('[INFO] Client closed');
    }
}

main();
