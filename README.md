# MemU JavaScript SDK

[![npm version](https://badge.fury.io/js/@memu%2Fsdk.svg)](https://www.npmjs.com/package/@memu/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official JavaScript/TypeScript SDK for the [MemU Cloud API](https://memu.pro/docs) - High-performance memory management for AI agents.

## Features

- **Full API v3 Coverage** - memorize, retrieve, categories, task status
- **High Performance** - Optimized HTTP client with connection pooling
- **Automatic Retry** - Exponential backoff with jitter for failed requests
- **Rate Limit Handling** - Respects Retry-After headers
- **Type Safety** - Full TypeScript support with comprehensive types
- **Custom Exceptions** - Specific error types for different failure cases
- **Universal** - Works in Node.js (18+) and modern browsers

## Installation

```bash
npm install @memu/sdk
# or
yarn add @memu/sdk
# or
pnpm add @memu/sdk
```

## Quick Start

### Get Your API Key

1. Sign up at [memu.so](https://memu.so)
2. Navigate to your dashboard to obtain your API key

### Basic Usage

```typescript
import { MemUClient } from '@memu/sdk';

const client = new MemUClient({ apiKey: 'your_api_key' });

// Memorize a conversation
const result = await client.memorize({
  conversation: [
    { role: 'user', content: 'I love Italian food, especially pasta.' },
    { role: 'assistant', content: "That's great! What's your favorite dish?" },
    { role: 'user', content: 'Carbonara is my absolute favorite!' },
  ],
  userId: 'user_123',
  agentId: 'my_assistant',
  waitForCompletion: true,
});

console.log(`Extracted ${result.items.length} memory items`);

// Retrieve memories
const memories = await client.retrieve('What food does the user like?', {
  userId: 'user_123',
  agentId: 'my_assistant',
});

for (const item of memories.items) {
  console.log(`[${item.memoryType}] ${item.summary}`);
}

// Clean up
await client.close();
```

### Using Auto-Cleanup

```typescript
// Using async disposal (Node.js 20+ or with polyfill)
await using client = new MemUClient({ apiKey: 'your_api_key' });

const result = await client.memorize({ /* ... */ });
// Client is automatically closed when block exits
```

## API Reference

### MemUClient

```typescript
new MemUClient({
  apiKey: string,           // Required: Your MemU API key
  baseUrl?: string,         // Default: 'https://api.memu.so'
  timeout?: number,         // Default: 60000 (ms)
  maxRetries?: number,      // Default: 3
})
```

### Methods

#### `memorize(options)`

Memorize a conversation and extract structured memory.

```typescript
const result = await client.memorize({
  // Required: Either conversation OR conversationText
  conversation: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there!' },
  ],
  // OR
  conversationText: 'User: Hello!\nAssistant: Hi there!',

  // Required
  userId: 'user_123',
  agentId: 'agent_456',

  // Optional
  userName: 'User',           // Default: 'User'
  agentName: 'Assistant',     // Default: 'Assistant'
  sessionDate: '2024-01-15',  // ISO format
  waitForCompletion: true,    // Wait for task to complete
  pollInterval: 2000,         // Polling interval (ms)
  timeout: 300000,            // Max wait time (ms)
});
```

#### `retrieve(query, options)`

Retrieve relevant memories based on a query.

```typescript
// Simple text query
const result = await client.retrieve('What are the user preferences?', {
  userId: 'user_123',
  agentId: 'agent_456',
});

// Conversation-aware query
const result = await client.retrieve(
  [
    { role: 'user', content: 'Tell me about food' },
    { role: 'assistant', content: 'What specifically?' },
  ],
  { userId: 'user_123', agentId: 'agent_456' }
);
```

#### `listCategories(options)`

List all memory categories for a user.

```typescript
const categories = await client.listCategories({
  userId: 'user_123',
  agentId: 'agent_456',
});

for (const cat of categories) {
  console.log(`${cat.name}: ${cat.itemCount} items`);
}
```

#### `getTaskStatus(taskId)`

Check the status of an async memorization task.

```typescript
const status = await client.getTaskStatus('task_abc123');

if (status.status === TaskStatusEnum.COMPLETED) {
  console.log('Task completed!');
}
```

## Error Handling

The SDK provides specific exception types:

```typescript
import {
  MemUClientError,
  MemUAuthenticationError,
  MemURateLimitError,
  MemUNotFoundError,
  MemUValidationError,
  isMemUError,
} from '@memu/sdk';

try {
  await client.memorize({ /* ... */ });
} catch (error) {
  if (error instanceof MemUAuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof MemURateLimitError) {
    console.log(`Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof MemUValidationError) {
    console.error('Validation errors:', error.validationErrors);
  } else if (isMemUError(error)) {
    console.error(`API error: ${error.message}`);
  }
}
```

## Data Types

### MemoryItem

```typescript
interface MemoryItem {
  id?: string;
  summary?: string;
  content?: string;
  memoryType?: 'preference' | 'skill' | 'opinion' | 'habit' | 'relationship' | string;
  categoryId?: string;
  categoryName?: string;
  score?: number;  // Relevance score (0-1)
}
```

### MemoryCategory

```typescript
interface MemoryCategory {
  id?: string;
  name?: string;
  summary?: string;
  description?: string;
  itemCount?: number;
  score?: number;
}
```

### TaskStatus

```typescript
enum TaskStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

interface TaskStatus {
  taskId: string;
  status: TaskStatusEnum;
  progress?: number;
  message?: string;
}
```

## Browser Usage

The SDK works in modern browsers with native `fetch` support:

```html
<script type="module">
  import { MemUClient } from 'https://esm.sh/@memu/sdk';

  const client = new MemUClient({ apiKey: 'your_key' });
  // ...
</script>
```

> **Security Warning**: Never expose API keys in client-side code for production. Use a backend proxy server.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint
```

## Requirements

- Node.js 18+ (for native fetch)
- TypeScript 5.0+ (for development)

## Support

- [Full API Documentation](https://memu.pro/docs)
- [Discord Community](https://discord.gg/memu)
- [Report Issues](https://github.com/NevaMind-AI/memU-sdk-js/issues)

## License

MIT License - see [LICENSE](./LICENSE) for details.
