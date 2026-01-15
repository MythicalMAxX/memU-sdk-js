/**
 * MemU SDK - Exhaustive Parameter Tests
 *
 * Tests every parameter, filter, and attribute of the SDK:
 * - MemUClientOptions: apiKey, baseUrl, timeout, maxRetries
 * - MemorizeOptions: conversation, conversationText, userId, agentId,
 *   userName, agentName, sessionDate, waitForCompletion, pollInterval, timeout
 * - RetrieveOptions: string query, conversation context
 * - ListCategoriesOptions: userId, agentId
 * - Additional: getTaskStatus, MemUClient.create(), error handling
 *
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs tests/exhaustive-params-test.mjs
 */

const API_KEY = process.env.MEMU_API_KEY;

if (!API_KEY) {
    console.error('[ERROR] MEMU_API_KEY environment variable is required');
    console.error('        Set it with: export MEMU_API_KEY=your_api_key');
    process.exit(1);
}

const USER_ID = 'exhaustive_test_user_' + Date.now();
const AGENT_ID = 'exhaustive_test_agent_' + Date.now();

const results = { passed: 0, failed: 0, tests: [] };

function test(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    const status = passed ? 'PASS' : 'FAIL';
    if (passed) {
        results.passed++;
        console.log('  [%s] %s', status, name);
    } else {
        results.failed++;
        console.log('  [%s] %s - %s', status, name, details);
    }
}

function section(title) {
    console.log('\n--- %s ---', title);
}

async function runExhaustiveTests() {
    console.log('MemU SDK Exhaustive Parameter Tests');
    console.log('====================================');
    console.log('User ID: %s', USER_ID);
    console.log('Agent ID: %s', AGENT_ID);

    const sdk = await import('../src/index.js');
    const { MemUClient, TaskStatusEnum, isMemUError } = sdk;

    // =========================================================================
    // SECTION 1: MemUClientOptions
    // =========================================================================
    section('1. MemUClientOptions');

    // apiKey (required)
    try {
        new MemUClient({ apiKey: API_KEY });
        test('apiKey: valid key accepted', true);
    } catch (e) { test('apiKey: valid key accepted', false, e.message); }

    try {
        new MemUClient({ apiKey: '' });
        test('apiKey: empty rejected', false, 'Should throw');
    } catch (e) { test('apiKey: empty rejected', true); }

    try {
        new MemUClient({ apiKey: '   ' });
        test('apiKey: whitespace rejected', false, 'Should throw');
    } catch (e) { test('apiKey: whitespace rejected', true); }

    // baseUrl (optional)
    try {
        const client = new MemUClient({ apiKey: API_KEY, baseUrl: 'https://api.memu.so' });
        await client.listCategories({ userId: USER_ID });
        test('baseUrl: custom value works', true);
        await client.close();
    } catch (e) { test('baseUrl: custom value works', false, e.message); }

    try {
        const client = new MemUClient({ apiKey: API_KEY, baseUrl: 'https://api.memu.so/' });
        await client.listCategories({ userId: USER_ID });
        test('baseUrl: trailing slash handled', true);
        await client.close();
    } catch (e) { test('baseUrl: trailing slash handled', false, e.message); }

    // timeout (optional)
    try {
        const client = new MemUClient({ apiKey: API_KEY, timeout: 5000 });
        test('timeout: custom value (5s) accepted', true);
        await client.close();
    } catch (e) { test('timeout: custom value (5s) accepted', false, e.message); }

    try {
        const client = new MemUClient({ apiKey: API_KEY, timeout: 120000 });
        test('timeout: large value (120s) accepted', true);
        await client.close();
    } catch (e) { test('timeout: large value (120s) accepted', false, e.message); }

    // maxRetries (optional)
    try {
        const client = new MemUClient({ apiKey: API_KEY, maxRetries: 0 });
        test('maxRetries: 0 accepted', true);
        await client.close();
    } catch (e) { test('maxRetries: 0 accepted', false, e.message); }

    try {
        const client = new MemUClient({ apiKey: API_KEY, maxRetries: 5 });
        test('maxRetries: 5 accepted', true);
        await client.close();
    } catch (e) { test('maxRetries: 5 accepted', false, e.message); }

    // All options combined
    try {
        const client = new MemUClient({
            apiKey: API_KEY,
            baseUrl: 'https://api.memu.so',
            timeout: 60000,
            maxRetries: 3,
        });
        await client.listCategories({ userId: USER_ID });
        test('All client options combined', true);
        await client.close();
    } catch (e) { test('All client options combined', false, e.message); }

    // =========================================================================
    // SECTION 2: MemorizeOptions
    // =========================================================================
    section('2. MemorizeOptions');

    const client = new MemUClient({ apiKey: API_KEY, timeout: 180000 });

    // conversation (structured)
    try {
        const result = await client.memorize({
            conversation: [
                { role: 'user', content: 'Test message' },
                { role: 'assistant', content: 'Test response' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: false,
        });
        test('conversation: structured array', !!result.taskId);
    } catch (e) { test('conversation: structured array', false, e.message); }

    // conversation with system role
    try {
        const result = await client.memorize({
            conversation: [
                { role: 'system', content: 'You are helpful' },
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi!' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: false,
        });
        test('conversation: with system role', !!result.taskId);
    } catch (e) { test('conversation: with system role', false, e.message); }

    // conversationText (raw text)
    try {
        const result = await client.memorize({
            conversationText: 'User: Test\nAssistant: Response',
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: false,
        });
        test('conversationText: raw text format', !!result.taskId);
    } catch (e) { test('conversationText: raw text format', false, e.message); }

    // userName and agentName
    try {
        const result = await client.memorize({
            conversation: [{ role: 'user', content: 'Name test' }],
            userId: USER_ID,
            agentId: AGENT_ID,
            userName: 'CustomUser',
            agentName: 'CustomAgent',
            waitForCompletion: false,
        });
        test('userName + agentName: custom names', !!result.taskId);
    } catch (e) { test('userName + agentName: custom names', false, e.message); }

    // sessionDate
    try {
        const result = await client.memorize({
            conversation: [{ role: 'user', content: 'Date test' }],
            userId: USER_ID,
            agentId: AGENT_ID,
            sessionDate: '2026-01-15T10:00:00Z',
            waitForCompletion: false,
        });
        test('sessionDate: ISO format', !!result.taskId);
    } catch (e) { test('sessionDate: ISO format', false, e.message); }

    // waitForCompletion: false
    try {
        const result = await client.memorize({
            conversation: [{ role: 'user', content: 'Async test' }],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: false,
        });
        test('waitForCompletion: false (async)', !!result.taskId && result.items.length === 0);
    } catch (e) { test('waitForCompletion: false (async)', false, e.message); }

    // waitForCompletion: true with pollInterval and timeout
    console.log('  Testing waitForCompletion: true...');
    try {
        const result = await client.memorize({
            conversation: [{ role: 'user', content: 'Sync test with options' }],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: true,
            pollInterval: 1500,
            timeout: 120000,
        });
        test('waitForCompletion: true with pollInterval and timeout', !!result.taskId);
    } catch (e) { test('waitForCompletion: true with pollInterval and timeout', false, e.message); }

    // All options combined
    console.log('  Testing all memorize options...');
    try {
        const result = await client.memorize({
            conversation: [
                { role: 'user', content: 'Full test: I enjoy reading and hiking' },
                { role: 'assistant', content: 'Great hobbies!' },
            ],
            userId: USER_ID,
            agentId: AGENT_ID,
            userName: 'TestUser',
            agentName: 'TestBot',
            sessionDate: new Date().toISOString(),
            waitForCompletion: true,
            pollInterval: 2000,
            timeout: 180000,
        });
        test('All memorize options combined', true);
    } catch (e) { test('All memorize options combined', false, e.message); }

    // =========================================================================
    // SECTION 3: RetrieveOptions
    // =========================================================================
    section('3. RetrieveOptions');

    // String query
    try {
        const result = await client.retrieve(
            'What hobbies does the user have?',
            { userId: USER_ID, agentId: AGENT_ID }
        );
        test('retrieve: string query', Array.isArray(result.items));
    } catch (e) { test('retrieve: string query', false, e.message); }

    // Conversation array
    try {
        const result = await client.retrieve(
            [
                { role: 'user', content: 'Tell me about my job' },
                { role: 'assistant', content: 'Checking...' },
            ],
            { userId: USER_ID, agentId: AGENT_ID }
        );
        test('retrieve: conversation array', Array.isArray(result.items));
    } catch (e) { test('retrieve: conversation array', false, e.message); }

    // Single message
    try {
        const result = await client.retrieve(
            [{ role: 'user', content: 'What do you know?' }],
            { userId: USER_ID, agentId: AGENT_ID }
        );
        test('retrieve: single message array', Array.isArray(result.items));
    } catch (e) { test('retrieve: single message array', false, e.message); }

    // Response structure
    try {
        const result = await client.retrieve('Test', { userId: USER_ID, agentId: AGENT_ID });
        const valid = Array.isArray(result.items) && Array.isArray(result.categories) && Array.isArray(result.resources);
        test('retrieve: response structure', valid);
    } catch (e) { test('retrieve: response structure', false, e.message); }

    // =========================================================================
    // SECTION 4: ListCategoriesOptions
    // =========================================================================
    section('4. ListCategoriesOptions');

    // userId only
    try {
        const result = await client.listCategories({ userId: USER_ID });
        test('listCategories: userId only', Array.isArray(result));
    } catch (e) { test('listCategories: userId only', false, e.message); }

    // userId + agentId
    try {
        const result = await client.listCategories({ userId: USER_ID, agentId: AGENT_ID });
        test('listCategories: userId + agentId', Array.isArray(result));
    } catch (e) { test('listCategories: userId + agentId', false, e.message); }

    // =========================================================================
    // SECTION 5: Additional Methods
    // =========================================================================
    section('5. Additional Methods');

    // getTaskStatus
    try {
        const memResult = await client.memorize({
            conversation: [{ role: 'user', content: 'Status test' }],
            userId: USER_ID,
            agentId: AGENT_ID,
            waitForCompletion: false,
        });
        if (memResult.taskId) {
            const status = await client.getTaskStatus(memResult.taskId);
            test('getTaskStatus: returns valid status', !!status.taskId && !!status.status);
        }
    } catch (e) { test('getTaskStatus: returns valid status', false, e.message); }

    // MemUClient.create()
    try {
        const factoryClient = MemUClient.create({ apiKey: API_KEY });
        await factoryClient.listCategories({ userId: USER_ID });
        test('MemUClient.create(): factory method', true);
        await factoryClient.close();
    } catch (e) { test('MemUClient.create(): factory method', false, e.message); }

    // Error handling
    try {
        await client.retrieve('', { userId: USER_ID, agentId: AGENT_ID });
        test('Error handling: empty query rejected', false);
    } catch (e) { test('Error handling: empty query rejected', true); }

    try {
        await client.memorize({
            conversation: [],
            userId: USER_ID,
            agentId: AGENT_ID,
        });
        test('Error handling: empty conversation rejected', false);
    } catch (e) { test('Error handling: empty conversation rejected', true); }

    await client.close();

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n====================================');
    console.log('TEST SUMMARY');
    console.log('====================================');
    console.log('Total: %d', results.passed + results.failed);
    console.log('Passed: %d', results.passed);
    console.log('Failed: %d', results.failed);
    console.log('Success Rate: %s%%', ((results.passed / (results.passed + results.failed)) * 100).toFixed(1));

    if (results.failed > 0) {
        console.log('\nFailed Tests:');
        for (const t of results.tests.filter(t => !t.passed)) {
            console.log('  - %s: %s', t.name, t.details);
        }
    }

    console.log('\nExhaustive parameter testing completed.');
    process.exit(results.failed > 0 ? 1 : 0);
}

runExhaustiveTests().catch(e => {
    console.error('[FATAL] Unhandled error:', e);
    process.exit(1);
});
