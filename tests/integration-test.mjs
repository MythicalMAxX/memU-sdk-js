/**
 * MemU SDK - Integration Test Suite
 *
 * Comprehensive tests for all SDK functionality:
 * - Client initialization and validation
 * - Memorize operations (async and sync)
 * - Task status polling
 * - Retrieve operations (string and conversation context)
 * - List categories
 * - Error handling
 * - Client lifecycle
 *
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs tests/integration-test.mjs
 */

const API_KEY = process.env.MEMU_API_KEY;

if (!API_KEY) {
    console.error('[ERROR] MEMU_API_KEY environment variable is required');
    console.error('        Set it with: export MEMU_API_KEY=your_api_key');
    process.exit(1);
}

const USER_ID = 'integration_test_user_' + Date.now();
const AGENT_ID = 'integration_test_agent_' + Date.now();

const results = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
    const status = passed ? 'PASS' : 'FAIL';
    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
        console.log('  [%s] %s', status, name);
    } else {
        results.failed++;
        console.log('  [%s] %s - %s', status, name, details);
    }
}

function logSection(title) {
    console.log('\n--- %s ---', title);
}

async function runTests() {
    console.log('MemU SDK Integration Test Suite');
    console.log('================================');
    console.log('User ID: %s', USER_ID);
    console.log('Agent ID: %s', AGENT_ID);

    let MemUClient, isMemUError, TaskStatusEnum;

    try {
        const sdk = await import('../src/index.js');
        MemUClient = sdk.MemUClient;
        isMemUError = sdk.isMemUError;
        TaskStatusEnum = sdk.TaskStatusEnum;
        logTest('SDK Import', true);
    } catch (error) {
        logTest('SDK Import', false, error.message);
        console.log('\n[FATAL] Failed to import SDK. Exiting.');
        process.exit(1);
    }

    let client;

    // =========================================================================
    // TEST 1: Client Initialization
    // =========================================================================
    logSection('Test 1: Client Initialization');

    try {
        client = new MemUClient({
            apiKey: API_KEY,
            timeout: 60000,
            maxRetries: 3,
        });
        logTest('Client creation with valid API key', true);
    } catch (error) {
        logTest('Client creation with valid API key', false, error.message);
        console.log('\n[FATAL] Failed to create client. Exiting.');
        process.exit(1);
    }

    try {
        new MemUClient({ apiKey: '' });
        logTest('Reject empty API key', false, 'Should have thrown');
    } catch (error) {
        logTest('Reject empty API key', true);
    }

    // =========================================================================
    // TEST 2: Memorize - Async Mode
    // =========================================================================
    logSection('Test 2: Memorize (Async)');

    let asyncTaskId = null;
    try {
        const asyncResult = await client.memorize({
            conversation: [
                { role: 'user', content: 'My name is John and I love chess.' },
                { role: 'assistant', content: 'Nice to meet you, John!' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            userName: 'John',
            agentName: 'TestBot',
            waitForCompletion: false,
        });

        asyncTaskId = asyncResult.taskId;
        logTest('Memorize async returns task ID', !!asyncTaskId);
        console.log('  Task ID: %s', asyncTaskId);
    } catch (error) {
        logTest('Memorize async', false, error.message);
    }

    // =========================================================================
    // TEST 3: Task Status Polling
    // =========================================================================
    logSection('Test 3: Task Status Polling');

    if (asyncTaskId) {
        try {
            console.log('  Polling task status...');
            let attempts = 0;
            const maxAttempts = 30;
            let finalStatus = null;

            while (attempts < maxAttempts) {
                const status = await client.getTaskStatus(asyncTaskId);
                console.log('  Attempt %d: Status = %s', attempts + 1, status.status);

                if (status.status === TaskStatusEnum.COMPLETED ||
                    status.status === TaskStatusEnum.SUCCESS ||
                    status.status === TaskStatusEnum.FAILED) {
                    finalStatus = status;
                    break;
                }

                attempts++;
                await new Promise(r => setTimeout(r, 3000));
            }

            if (finalStatus) {
                const passed = finalStatus.status === TaskStatusEnum.COMPLETED ||
                    finalStatus.status === TaskStatusEnum.SUCCESS;
                logTest('Task status polling', passed, 'Final: ' + finalStatus.status);
            } else {
                logTest('Task status polling', false, 'Timeout');
            }
        } catch (error) {
            logTest('Task status polling', false, error.message);
        }
    } else {
        logTest('Task status polling', false, 'No task ID');
    }

    // =========================================================================
    // TEST 4: Memorize - Sync Mode
    // =========================================================================
    logSection('Test 4: Memorize (Sync)');

    try {
        console.log('  Memorizing with waitForCompletion=true...');
        const syncResult = await client.memorize({
            conversation: [
                { role: 'user', content: 'I work as a software engineer at Google.' },
                { role: 'assistant', content: 'That sounds fascinating!' },
                { role: 'user', content: 'I specialize in machine learning.' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: true,
            pollInterval: 2000,
            timeout: 180000,
        });

        console.log('  Task ID: %s', syncResult.taskId);
        console.log('  Items: %d', syncResult.items.length);
        console.log('  Categories: %d', syncResult.categories.length);
        logTest('Memorize sync (waitForCompletion)', true);
    } catch (error) {
        logTest('Memorize sync (waitForCompletion)', false, error.message);
    }

    // =========================================================================
    // TEST 5: Retrieve - String Query
    // =========================================================================
    logSection('Test 5: Retrieve (String Query)');

    try {
        const result = await client.retrieve(
            'What does the user do for work?',
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('  Items: %d', result.items.length);
        console.log('  Categories: %d', result.categories.length);
        logTest('Retrieve with string query', true);
    } catch (error) {
        logTest('Retrieve with string query', false, error.message);
    }

    // =========================================================================
    // TEST 6: Retrieve - Conversation Context
    // =========================================================================
    logSection('Test 6: Retrieve (Conversation Context)');

    try {
        const result = await client.retrieve(
            [
                { role: 'user', content: 'What hobbies do I have?' },
                { role: 'assistant', content: 'Let me check...' },
            ],
            { userId: USER_ID, agentId: AGENT_ID }
        );

        console.log('  Items: %d', result.items.length);
        logTest('Retrieve with conversation context', true);
    } catch (error) {
        logTest('Retrieve with conversation context', false, error.message);
    }

    // =========================================================================
    // TEST 7: List Categories
    // =========================================================================
    logSection('Test 7: List Categories');

    try {
        const categories = await client.listCategories({
            userId: USER_ID,
            agentId: AGENT_ID,
        });

        console.log('  Categories: %d', categories.length);
        logTest('List categories', true);
    } catch (error) {
        logTest('List categories', false, error.message);
    }

    // =========================================================================
    // TEST 8: Error Handling
    // =========================================================================
    logSection('Test 8: Error Handling');

    try {
        await client.retrieve('', { userId: USER_ID, agentId: AGENT_ID });
        logTest('Reject empty query', false, 'Should have thrown');
    } catch (error) {
        logTest('Reject empty query', true);
    }

    try {
        await client.retrieve('test', { userId: '', agentId: AGENT_ID });
        logTest('Reject empty userId', false, 'Should have thrown');
    } catch (error) {
        logTest('Reject empty userId', true);
    }

    // =========================================================================
    // TEST 9: Client Lifecycle
    // =========================================================================
    logSection('Test 9: Client Lifecycle');

    try {
        await client.close();
        logTest('Client close', true);

        try {
            await client.retrieve('test', { userId: USER_ID, agentId: AGENT_ID });
            logTest('Reject operations on closed client', false, 'Should have thrown');
        } catch (error) {
            logTest('Reject operations on closed client', error.message.includes('closed'));
        }
    } catch (error) {
        logTest('Client close', false, error.message);
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n================================');
    console.log('TEST SUMMARY');
    console.log('================================');
    console.log('Total: %d', results.passed + results.failed);
    console.log('Passed: %d', results.passed);
    console.log('Failed: %d', results.failed);
    console.log('Success Rate: %s%%', ((results.passed / (results.passed + results.failed)) * 100).toFixed(1));

    if (results.failed > 0) {
        console.log('\nFailed Tests:');
        for (const test of results.tests.filter(t => !t.passed)) {
            console.log('  - %s: %s', test.name, test.details);
        }
    }

    console.log('\nIntegration test completed.');
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('[FATAL] Unhandled error:', error);
    process.exit(1);
});
