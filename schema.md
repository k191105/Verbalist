# Verbalist Data Schema

## Overview

This document defines the Firestore data structure for Verbalist. The schema is designed to be economical (minimize storage costs) while supporting all required features.

## Collections

### 1. `users`

Stores user profiles and preferences.

```typescript
User {
  id: string                    // Auto-generated Firebase Auth UID
  name: string                  // User's display name
  email?: string                // Optional email (if provided)
  createdAt: timestamp          // Account creation date
  activeWordListId: string      // Reference to current word list
  tier: 'free' | 'premium'      // Subscription tier
  dailyUsageCount: number       // Number of chats completed today (resets daily)
  lastResetDate: string         // ISO date of last usage reset (YYYY-MM-DD)
  customInstructions?: string   // Premium: custom AI instructions
  preferences: {
    theme: 'light' | 'dark'
    chatBackground?: string     // Background color/image preference
    fontSize: 'small' | 'medium' | 'large'
  }
  notificationToken?: string    // FCM device token for push notifications
}
```

**Notes:**
- `dailyUsageCount` is reset when `lastResetDate` differs from current date
- Don't store RevenueCat details here (query RevenueCat API directly)

---

### 2. `wordLists`

Stores both template word lists (centralized) and custom user lists.

```typescript
WordList {
  id: string                    // Auto-generated
  name: string                  // Display name
  isTemplate: boolean           // true for centralized lists, false for user-created
  userId?: string               // Only set for custom lists (null for templates)
  createdAt: timestamp
  words: string[]               // Array of words (lowercase, no duplicates)
  wordCount: number             // Cached count for UI display
  description?: string          // Optional description for templates
}
```

**Template Word Lists (Pre-created):**
- ID: `template-general` → "General High-Level Vocabulary"
- ID: `template-literary` → "Literary and Rhetorical"
- ID: `template-politics` → "Politics and Public Life"

**Notes:**
- Templates are created once and shared across all users (don't duplicate)
- Custom lists reference `userId` for ownership
- Store as flat array for simplicity (no nested objects per word in list)

---

### 3. `srsState`

Stores Spaced Repetition System state per word per user.

```typescript
SRSState {
  id: string                    // Format: `{userId}_{wordListId}_{word}`
  userId: string                // User reference
  wordListId: string            // Word list reference
  word: string                  // The actual word (lowercase)
  bucket: number                // SRS bucket (0-6, higher = more mastered)
  lastReviewed: timestamp       // Last time word was used/reviewed
  reviewCount: number           // Total number of times word appeared
  correctUses: number           // Times user correctly used the word
  confidence: number            // 0.0-1.0 score (for UI styling)
}
```

**Notes:**
- Composite ID prevents duplicates and enables efficient lookups
- `confidence` is calculated from `bucket` and `correctUses/reviewCount` ratio
- Don't store full history of each use (too expensive)
- Bucket progression: 0 → 1 → 2 → 3 → 4 → 5 → 6 (mastered)

---

### 4. `chatSessions`

Stores metadata for chat sessions (not full message history).

```typescript
ChatSession {
  id: string                    // Auto-generated
  userId: string                // User reference
  personaId: string             // 'chris' | 'gemma' | 'eva' | 'sid'
  wordListId: string            // Active word list for this session
  status: 'active' | 'complete' // Session state
  startedAt: timestamp
  completedAt?: timestamp       // Set when status becomes 'complete'
  messageCount: number          // Track against soft/hard limits
  wordBag: {                    // Selected words for this session
    word: string
    targetUseCount: number      // How many times to encourage usage
    currentUseCount: number     // Times actually used so far
  }[]
  contextWindow: string[]       // Last N message IDs for LLM context (max 10)
}
```

**Notes:**
- Don't store full message objects here (too costly at scale)
- `contextWindow` stores only message IDs for retrieval during active chat
- After session completes, messages can be archived/deleted
- Free users: max 2 active sessions per day
- Premium users: max 8 active sessions per day

---

### 5. `messages`

Stores individual messages during active sessions only.

```typescript
Message {
  id: string                    // Auto-generated
  sessionId: string             // Parent session reference
  role: 'user' | 'assistant'    // Message sender
  content: string               // Message text
  timestamp: timestamp
  wordUsage?: string[]          // Words from word bag used in this message
}
```

**Notes:**
- Messages are stored only while session is active
- After session completes, only keep last few for "past chats" read-only view
- Archive or delete old messages after X days to save costs
- Don't store unnecessary metadata (avatar, system messages, etc.)

---

### 6. `pastChats` (Optional, for read-only transcripts)

Stores compressed summaries of completed chats.

```typescript
PastChat {
  id: string                    // Same as original sessionId
  userId: string
  personaId: string
  completedAt: timestamp
  messageCount: number
  excerpt: string               // First few messages for preview
  summary?: string              // Optional AI-generated summary
}
```

**Notes:**
- This is a lighter version of completed sessions
- Full messages are deleted after session ends
- Only store if needed for "past chats" feature (may skip for MVP)

---

## Firestore Indexes

Required composite indexes:

1. `users` collection:
   - No additional indexes needed (queries by `id` only)

2. `wordLists` collection:
   - Index: `userId` ASC, `createdAt` DESC (for user's custom lists)
   - Index: `isTemplate` ASC (for fetching templates)

3. `srsState` collection:
   - Index: `userId` ASC, `wordListId` ASC, `lastReviewed` ASC (for word bag selection)
   - Index: `userId` ASC, `wordListId` ASC, `bucket` DESC (for progress tracking)

4. `chatSessions` collection:
   - Index: `userId` ASC, `status` ASC, `startedAt` DESC (for active chats)
   - Index: `userId` ASC, `personaId` ASC, `status` ASC (for persona-specific chats)

5. `messages` collection:
   - Index: `sessionId` ASC, `timestamp` ASC (for chronological message retrieval)

---

## Storage Cost Optimization

1. **Don't store redundant data:**
   - Template word lists are shared (not duplicated per user)
   - SRS state is minimal (no full history)
   - Messages are pruned after session completion

2. **Use references instead of duplication:**
   - `activeWordListId` in User → reference, not copy
   - `sessionId` in Message → reference, not embedding session data

3. **Archive old data:**
   - Move completed sessions older than 30 days to cold storage
   - Delete messages from completed sessions after 7 days

4. **Efficient querying:**
   - Use indexes to avoid full collection scans
   - Limit message retrieval to context window size (last 10 messages)

---

## Example Data Flow

### User signs up:
1. Create `users/{userId}` doc
2. Set `activeWordListId` = `template-general` (default)
3. No SRS state yet (created on first session)

### User starts chat:
1. Cloud Function selects word bag from `srsState` (or initializes if empty)
2. Create `chatSessions/{sessionId}` doc
3. Generate first message (stored in `messages` collection)
4. Return session + first message to frontend

### User sends message:
1. Create `messages/{messageId}` doc with user's message
2. Update `chatSession.messageCount`
3. Detect word usage from word bag → update `srsState`
4. Generate AI response → create another `messages` doc
5. Update `chatSession.contextWindow` with last N message IDs

### Session completes:
1. Update `chatSession.status` = 'complete'
2. Optionally create `pastChats/{sessionId}` with summary
3. Clean up old messages (async job)
4. Update user's `dailyUsageCount`

---

## TypeScript Type Definitions

```typescript
// Shared types for frontend and backend

export type UserTier = 'free' | 'premium';
export type PersonaId = 'chris' | 'gemma' | 'eva' | 'sid';
export type SessionStatus = 'active' | 'complete';
export type MessageRole = 'user' | 'assistant';

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  activeWordListId: string;
  tier: UserTier;
  dailyUsageCount: number;
  lastResetDate: string;
  customInstructions?: string;
  preferences: {
    theme: 'light' | 'dark';
    chatBackground?: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  notificationToken?: string;
}

export interface WordList {
  id: string;
  name: string;
  isTemplate: boolean;
  userId?: string;
  createdAt: Date;
  words: string[];
  wordCount: number;
  description?: string;
}

export interface SRSState {
  id: string;
  userId: string;
  wordListId: string;
  word: string;
  bucket: number;
  lastReviewed: Date;
  reviewCount: number;
  correctUses: number;
  confidence: number;
}

export interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  personaId: PersonaId;
  wordListId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  messageCount: number;
  wordBag: WordBagItem[];
  contextWindow: string[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  wordUsage?: string[];
}

export interface PastChat {
  id: string;
  userId: string;
  personaId: PersonaId;
  completedAt: Date;
  messageCount: number;
  excerpt: string;
  summary?: string;
}
```