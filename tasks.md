# Verbalist Development Tasks

## Task Organization Principles

- Each task is small, testable, and focused on one concern
- Tasks are ordered to maximize stackability and early testing
- Low-hanging fruit implemented early for quick wins
- **MVP Complete** milestone clearly marked
- Dependencies are explicit
- When finished with a task, put a - through the box for that task. 

---

## Phase 0: Project Setup & Infrastructure

### 0.1 Initialize Project Structure
**Goal:** Create repository with basic folder structure  
**Test:** Verify folders exist and are navigable

- [ ] ~~Create root directory with `frontend/`, `backend/`, `shared/` folders. See architecture.md for structure.~~ 
- [ ] ~~Initialize git repository with `.gitignore` for Node.js and React Native~~
- [ ] ~~Create `shared/secrets.example.ts` template file~~

**Dependencies:** None  
**Estimated time:** 15 min

---

### 0.2 Setup Shared Configuration
**Goal:** Define all constants, personas, and word lists  
**Test:** Import and log constants in a test file

- [ ] ~~Create `shared/config/constants.ts` with:~~
  - Base chat limits (free: 1/day, premium: 5/day) + bonus chats for mastery (free max: 3, premium max: 8)
  - Character limits per message (e.g., 500 chars)
  - Word bag size (3-5 words)
  - Session soft wind-down (e.g., 15 messages) and hard limit (e.g., 20 messages)
  - Theme color palette
- [ ] ~~Create `shared/config/personas.ts` with:~~
  - Persona objects: `{ id, name, displayName, expertise, description }`
  - Chris (default), Gemma (literature/arts), Eva (philosophy/psychology), Sid (history/politics)
- [ ] ~~Create `shared/config/wordLists.ts` with:~~
  - Template word list definitions (IDs, names, words arrays)
  - At least 50 words per template list

**Dependencies:** 0.1  
**Estimated time:** 30 min

---

### 0.3 Initialize Expo Frontend
**Goal:** Create React Native project with navigation  
**Test:** Run app on simulator/device, see blank screen

- [ ] ~~Run `npx create-expo-app frontend --template blank-typescript`~~
- [ ] ~~Install dependencies:~~
  - `expo-router` (or React Navigation)
  - `react-native-gifted-chat`
  - `react-native-reanimated`
  - `react-native-gesture-handler`
  - `react-native-safe-area-context`
- [ ] ~~Configure `app.json` with app name, bundle identifier, version~~
- [ ] ~~Create basic folder structure in `frontend/src/`:~~
  - `screens/`, `components/`, `navigation/`, `services/`, `hooks/`, `types/`, `utils/`
- [ ] ~~Create placeholder `App.tsx` with "Verbalist" text~~

**Dependencies:** 0.1  
**Estimated time:** 20 min

---

### 0.4 Initialize Firebase Backend
**Goal:** Setup Firebase project and Firestore  
**Test:** Access Firebase Console, verify project exists

- [ ] ~~Create Firebase project in Firebase Console~~
- [ ] ~~Enable Firestore Database (start in test mode for now)~~
- [ ] ~~Enable Firebase Authentication with anonymous provider~~
- [ ] ~~Install Firebase CLI globally: `npm install -g firebase-tools`~~
- [ ] ~~Run `firebase login` and `firebase init` in backend directory~~
- [ ] ~~Select Firestore and Functions during initialization~~
- [ ] ~~Create `backend/firestore.rules` with basic security rules~~
- [ ] Deploy initial Firestore rules: `firebase deploy --only firestore:rules`

**Dependencies:** 0.1  
**Estimated time:** 30 min

---

### 0.5 Connect Frontend to Firebase
**Goal:** Initialize Firebase SDK in React Native  
**Test:** Log "Firebase initialized" on app start

- [ ] ~~Install Firebase SDK: `npm install firebase` in frontend~~
- [ ] ~~Create `frontend/src/services/firebase.ts`:~~
  - Initialize Firebase with config from Firebase Console
  - Export `auth` and `firestore` instances
- [ ] ~~Import and call initialization in `App.tsx`~~
- [ ] ~~Add Firebase config to `.env` or `app.json` extras~~
- [ ] Test: Log `firebase.app().name` to console

**Dependencies:** 0.3, 0.4  
**Estimated time:** 20 min

---

## Phase 1: Core Data Layer (No UI Yet)

### 1.1 Define TypeScript Types
**Goal:** Create shared type definitions  
**Test:** Import types in multiple files without errors

- [ ] ~~Create `shared/types/index.ts` (copy from schema.md)~~
- [ ] ~~Export all interfaces: User, WordList, SRSState, ChatSession, Message, PastChat~~
- [ ] ~~Export enums/types: UserTier, PersonaId, SessionStatus, MessageRole~~
- [ ] ~~Add to `shared/tsconfig.json` for easy imports~~

**Dependencies:** 0.1, 0.2  
**Estimated time:** 15 min

---

### 1.2 Seed Template Word Lists
**Goal:** Create template word lists in Firestore  
**Test:** View word lists in Firebase Console

- [ ] ~~Create script `backend/scripts/seedWordLists.ts`~~
- [ ] ~~Read word lists from `shared/config/wordLists.ts`~~
- [ ] ~~For each template list, create Firestore document with ID `template-{name}`~~
- [ ] ~~Set `isTemplate: true`, `userId: null`~~
- [ ] Run script: `node seedWordLists.ts`
- [ ] Verify in Firestore Console: 3 template word lists exist

**Dependencies:** 0.4, 0.5, 1.1  
**Estimated time:** 30 min

---

### 1.3 Implement Firestore Service (Frontend)
**Goal:** Create helper functions for Firestore reads  
**Test:** Fetch a word list and log to console

- [ ] ~~Create `frontend/src/services/firestore.ts`~~
- [ ] ~~Implement functions:~~
  - `getUserProfile(userId: string): Promise<User | null>`
  - `getWordList(wordListId: string): Promise<WordList | null>`
  - `getTemplateWordLists(): Promise<WordList[]>`
- [ ] ~~Use Firebase SDK to query Firestore~~
- [ ] ~~Test: Call `getTemplateWordLists()` in App.tsx and log results~~

**Dependencies:** 0.5, 1.1, 1.2  
**Estimated time:** 30 min

---

## Phase 2: Authentication & User Flow

### 2.1 Implement Anonymous Authentication
**Goal:** Sign in users anonymously on app launch  
**Test:** User is authenticated, userId logged to console

- [ ] ~~Create `frontend/src/services/auth.ts`~~
- [ ] ~~Implement `signInAnonymously()` using Firebase Auth~~
- [ ] ~~On success, create user document in Firestore if doesn't exist~~
- [ ] ~~Set default `activeWordListId` to `template-general`~~
- [ ] ~~Set `tier: 'free'`, `dailyUsageCount: 0`~~
- [ ] ~~Call auth function in `App.tsx` on mount~~
- [ ] ~~Log userId to console on success~~

**Dependencies:** 0.5, 1.1  
**Estimated time:** 30 min

---

### 2.2 Create AuthContext
**Goal:** Provide user state across app  
**Test:** Access user in any component via context

- [ ] ~~Create `frontend/src/hooks/useAuth.ts`~~
- [ ] ~~Implement AuthContext with:~~
  - `user: User | null`
  - `loading: boolean`
  - `signIn()`, `signOut()` functions
- [ ] ~~Listen to Firebase Auth state changes~~
- [ ] ~~Fetch/update user profile from Firestore on auth change~~
- [ ] ~~Wrap `App.tsx` with `AuthProvider`~~
- [ ] ~~Test: Access `useAuth()` in a dummy component and log user~~

**Dependencies:** 2.1  
**Estimated time:** 30 min

---

## Phase 3: Onboarding Screens

### 3.1 Create WelcomeScreen (Blank Placeholder)
**Goal:** First screen users see  
**Test:** Navigate to WelcomeScreen, see static content

- [x] ~~Create `frontend/src/screens/onboarding/WelcomeScreen.tsx`~~
- [x] ~~Display app logo and welcome text~~
- [x] ~~Add "Get Started" button~~
- [x] ~~Button navigates to WordListSelectionScreen~~
- [x] ~~Setup navigation stack with WelcomeScreen as first route~~

**Dependencies:** 0.3, 2.2  
**Estimated time:** 20 min

---

### 3.2 Create WordListSelectionScreen
**Goal:** Let users choose a word list  
**Test:** See template word lists, tap one, continue to chat

- [x] ~~Create `frontend/src/screens/onboarding/WordListSelectionScreen.tsx`~~
- [x] ~~Fetch template word lists using `getTemplateWordLists()`~~
- [x] ~~Display as list with title, description, word count~~
- [x] ~~Add button for "Create Custom List"~~
- [x] ~~On template selection:~~
  - ~~Update user's `activeWordListId` in Firestore~~
  - ~~Navigate to ChatScreen (via PresetDetailScreen)~~
- [x] ~~On "Create Custom List":~~
  - ~~Navigate to CustomWordListScreen~~

**Dependencies:** 1.3, 3.1  
**Estimated time:** 45 min

---

### 3.3 Create CustomWordListScreen
**Goal:** Allow users to create custom word lists  
**Test:** Paste words, see parsed pills, confirm list, navigate to chat

- [x] ~~Create `frontend/src/screens/onboarding/CustomWordListScreen.tsx`~~
- [x] ~~Large TextInput for pasting/typing words~~
- [x] ~~Implement `frontend/src/utils/wordValidator.ts`:~~
  - ~~Split by whitespace, newlines, commas~~
  - ~~Trim, lowercase, remove duplicates~~
  - ~~Return array of words~~
- [x] ~~Display parsed words as list with validation~~
- [x] ~~Show progress bar: "X / 20 words minimum"~~
- [x] ~~Disable "Done" button until minimum reached~~
- [x] ~~On "Done":~~
  - ~~Create new WordList document in Firestore~~
  - ~~Set as user's `activeWordListId`~~
  - ~~Navigate to ChatScreen~~

**Dependencies:** 3.2, 1.3  
**Estimated time:** 60 min

---

### 3.4 Add Onboarding State Persistence
**Goal:** Skip onboarding if user already has word list  
**Test:** Close and reopen app, go directly to dashboard

- [ ] In App.tsx, check if user has `activeWordListId` set
- [ ] If yes: Navigate to DashboardScreen
- [ ] If no: Navigate to WelcomeScreen
- [ ] Use AsyncStorage or check Firestore on auth

**Dependencies:** 2.2, 3.3  
**Estimated time:** 20 min

---

### 3.5 Create AccountSetupScreen
**Goal:** Final onboarding step for user profile setup  
**Test:** Navigate to AccountSetupScreen, enter name, proceed to chat

- [x] ~~Create `frontend/src/screens/onboarding/AccountSetupScreen.tsx`~~
- [x] ~~Display name input field~~
- [x] ~~Add sign-in options placeholder (Coming Soon card)~~
- [x] ~~Save name to Firestore on continue~~
- [x] ~~Add "Skip for now" option~~
- [x] ~~Navigate to Chat on complete~~
- [x] ~~Use Lapis theme (themes cycle)~~

**Dependencies:** 3.3  
**Estimated time:** 30 min

---

### 3.6 Create PresetDetailScreen with Edit Mode
**Goal:** View and optionally edit preset word lists  
**Test:** View preset words, edit to create custom list

- [x] ~~Create `frontend/src/screens/onboarding/PresetDetailScreen.tsx`~~
- [x] ~~Display all words from preset in scrollable list~~
- [x] ~~Add "Edit" button to enable editing mode~~
- [x] ~~In edit mode: show text input, delete buttons on words~~
- [x] ~~On edit: create custom list instead of using preset~~
- [x] ~~Navigate to AccountSetupScreen on continue~~

**Dependencies:** 3.2  
**Estimated time:** 45 min

---

## Phase 4: Chat UI (Frontend Only, No Backend Yet)

### 4.1 Create ChatScreen with Custom UI
**Goal:** Display custom chat interface with iMessage-style bubbles  
**Test:** See iMessage-style chat with mock messages, send new messages

- [x] ~~Create `frontend/src/screens/chat/ChatScreen.tsx`~~
- [x] ~~Build custom chat UI (not gifted-chat) with:~~
  - ~~FlatList for messages~~
  - ~~Message bubble component with tails~~
  - ~~User messages on right (blue #007AFF)~~
  - ~~AI messages on left (gray #E5E5EA)~~
  - ~~Date separators~~
  - ~~Timestamps for message groups~~
  - ~~Target word highlighting (bold)~~
- [x] ~~Create header with:~~
  - ~~Back button (navigate to Dashboard)~~
  - ~~Persona name (tappable)~~
  - ~~Word list subtitle~~
  - ~~More options button~~
- [x] ~~Create input area with:~~
  - ~~Word bag button (left)~~
  - ~~Auto-growing TextInput~~
  - ~~Send button (right)~~
- [x] ~~Add typing indicator component~~
- [x] ~~Test: Send message, see it appear in chat~~

**Dependencies:** 0.3  
**Estimated time:** 90 min

---

### 4.2 Add Word Bag Overlay Component
**Goal:** Show current target words on demand  
**Test:** Tap word bag button, see island with words and confidence bars

- [x] ~~Create `frontend/src/components/WordBagOverlay.tsx`~~
- [x] ~~Accept `words: WordBagItem[]` and `visible: boolean` props~~
- [x] ~~Display as floating island above input:~~
  - ~~Slide-up animation~~
  - ~~Arrow pointing to button~~
  - ~~Word list with confidence bars~~
- [x] ~~Each word shows:~~
  - ~~Word text~~
  - ~~Confidence bar (visual progress)~~
- [x] ~~Tap outside to close~~
- [x] ~~In ChatScreen, toggle overlay on word bag button press~~

**Dependencies:** 4.1  
**Estimated time:** 45 min

---

### 4.3 Implement Long-Press to Add Word
**Goal:** Long-press any word in chat to add to word list  
**Test:** Long-press word, see action sheet, tap "Add to Word List"

- [x] ~~In ChatScreen, handle onLongPress on message text~~
- [x] ~~Extract words from message (4+ letter words)~~
- [x] ~~Show action sheet with "Add to Word List" options~~
- [x] ~~On confirm, log word to console (no backend yet)~~
- [x] ~~Show success toast: "{word} added to your list"~~
- [x] ~~Add haptic feedback (expo-haptics)~~

**Dependencies:** 4.1  
**Estimated time:** 30 min

---

## Phase 5: Backend - Chat Session Management

### 5.1 Setup Cloud Functions Structure
**Goal:** Initialize Firebase Cloud Functions with TypeScript  
**Test:** Deploy empty function, call it via HTTP

- [x] ~~In `backend/functions/`, install dependencies:~~
  - ~~`firebase-functions`, `firebase-admin`, `openai`~~
- [x] ~~Create `backend/functions/src/index.ts` as entry point~~
- [x] ~~Create placeholder function `helloWorld` that returns "Hello"~~
- [x] ~~Deploy: `firebase deploy --only functions`~~
- [x] ~~Test: Call function URL in browser, see "Hello"~~

**Dependencies:** 0.4  
**Estimated time:** 30 min

---

### 5.2 Implement createSession Cloud Function
**Goal:** Initialize chat session with word bag  
**Test:** Call function, get session ID and first message back

- [x] ~~Create `backend/functions/src/chat/sessionManager.ts`~~
- [x] ~~Implement `createSession(userId, personaId, wordListId)`:~~
  - ~~Fetch user's active word list from Firestore~~
  - ~~Select 3-5 words for word bag (random for now, no SRS yet)~~
  - ~~Create ChatSession document in Firestore~~
  - ~~Generate first message using OpenAI API (see 5.3)~~
  - ~~Return `{ sessionId, wordBag, firstMessage }`~~
- [x] ~~Export as callable Cloud Function in `index.ts`~~
- [x] ~~Test with Postman/curl, verify session created in Firestore~~

**Dependencies:** 5.1, 1.1  
**Estimated time:** 60 min

---

### 5.3 Implement OpenAI Integration
**Goal:** Generate AI chat messages  
**Test:** Pass prompt, get coherent response

- [x] ~~Create `backend/functions/src/llm/openai.ts`~~
- [x] ~~Store OpenAI API key in Firebase Functions config:~~
  - ~~`firebase functions:config:set openai.key="YOUR_KEY"`~~
- [x] ~~Implement `generateChatResponse(persona, context, wordBag)`:~~
  - ~~Build system prompt from persona definition~~
  - ~~Include instructions to use words from word bag naturally~~
  - ~~Use gpt-4o-mini for chat; store models in constant file for easy modification later.~~
  - ~~Max tokens: 150~~
- [x] ~~Return response text~~
- [ ] Test: Call function with test prompt, log response

**Dependencies:** 5.1, 0.2  
**Estimated time:** 45 min

---

### 5.4 Create Persona Prompt Templates
**Goal:** Define system prompts for each persona  
**Test:** Generate first message for each persona, verify style differences

- [x] ~~Create `backend/functions/src/llm/prompts.ts`~~
- [x] ~~Define prompt templates for:~~
  - ~~**Chris**: Friendly, versatile, everyday conversation~~
  - ~~**Gemma**: Literary, artistic, quotes from literature~~
  - ~~**Eva**: Philosophical, introspective, psychology-focused~~
  - ~~**Sid**: Historical, political, current events~~
- [x] ~~Include instructions to:~~
  - ~~Use words from word bag naturally (3-5 times per conversation)~~
  - ~~Keep messages concise (2-3 sentences)~~
  - ~~Sound like texting a peer, not a tutor~~
  - ~~Avoid explicitly saying "let's use X word"~~
- [x] ~~Include first message prompt builder for each persona~~
- [ ] Test: Generate first message for each persona using OpenAI

**Dependencies:** 5.3, 0.2  
**Estimated time:** 60 min

---

### 5.5 Implement sendMessage Cloud Function
**Goal:** Process user message and return AI response  
**Test:** Send message via function, get response and updated session

- [x] ~~Create `backend/functions/src/chat/messageHandler.ts`~~
- [x] ~~Implement `sendMessage(sessionId, userMessage)`:~~
  - ~~Store user message in Firestore~~
  - ~~Fetch last N messages from session for context~~
  - ~~Detect if user used any words from word bag (simple string matching)~~
  - ~~Update `wordBag.currentUseCount` if word used~~
  - ~~Call OpenAI with context + persona prompt + word bag~~
  - ~~Store AI response in Firestore~~
  - ~~Increment `session.messageCount`~~
  - ~~Update `session.contextWindow` with new message IDs~~
  - ~~Check if session should complete (messageCount >= hard limit)~~
  - ~~If complete, mark session as complete~~
  - ~~Return `{ aiMessage, sessionStatus, updatedWordBag }`~~
- [x] ~~Export as callable Cloud Function~~
- [ ] Test: Send multiple messages, verify conversation flow

**Dependencies:** 5.2, 5.3  
**Estimated time:** 90 min

---

## Phase 6: Connect Frontend to Backend

### 6.1 Integrate createSession into ChatScreen
**Goal:** Start real chat session when user opens ChatScreen  
**Test:** Open chat, see loading, then first message from AI

- [x] ~~Create `frontend/src/services/chat.ts`~~
- [x] ~~Implement `startChatSession(personaId)`:~~
  - ~~Get userId and activeWordListId from AuthContext~~
  - ~~Call createSession Cloud Function~~
  - ~~Return session data~~
- [x] ~~In ChatScreen, call `startChatSession` on mount~~
- [x] ~~Show loading spinner while waiting~~
- [x] ~~Once session created:~~
  - ~~Store sessionId, wordBag in component state~~
  - ~~Display first message in chat~~
- [ ] Test: Open chat, verify session created in Firestore

**Dependencies:** 4.1, 5.2, 2.2  
**Estimated time:** 45 min

---

### 6.2 Integrate sendMessage into ChatScreen
**Goal:** Send user messages and receive AI responses  
**Test:** Type message, send, see AI reply in real-time

- [x] ~~In `chat.ts`, implement `sendUserMessage(sessionId, message)`:~~
  - ~~Call sendMessage Cloud Function~~
  - ~~Return AI response and updated state~~
- [x] ~~In ChatScreen, on user sends message:~~
  - ~~Add message to chat immediately (optimistic UI)~~
  - ~~Call `sendUserMessage`~~
  - ~~Add AI response to chat~~
  - ~~Update word bag state if changed~~
  - ~~If session completed, show session end flow~~
- [x] ~~Add typing indicator while waiting for AI response~~
- [ ] Test: Have full conversation with AI

**Dependencies:** 6.1, 5.5  
**Estimated time:** 45 min

---

### 6.3 Implement Real-Time Message Listener - IGNORE THIS. We don't have sync messages across devices.
**Goal:** Sync messages across devices (if user logs in elsewhere)  
**Test:** Send message, see it appear in Firestore real-time

- [ ] In ChatScreen, setup Firestore listener:
  - Listen to `messages` collection where `sessionId == currentSession`
  - On new message, append to GiftedChat
- [ ] Unsubscribe on component unmount
- [ ] Test: Manually add message in Firestore Console, see it appear in app

**Dependencies:** 6.2  
**Estimated time:** 30 min

---

### 6.4 Implement LLM-Guided Word Usage Detection
**Goal:** Use LLM to score how well user uses target words (1-10 scale)  
**Test:** Use a target word correctly, see it marked in word bag overlay; use it incorrectly, see no credit

- [x] ~~Add `scoreWordUsage()` in `openai.ts` — calls cheapest model with tiny prompt, returns scores 1-10 per word~~
- [x] ~~Replace regex-based `detectWordUsage` in `messageHandler.ts` with LLM-based scoring~~
- [x] ~~Only count a word as "used" if LLM scores it >= 6 (reasonably correct/natural usage)~~
- [x] ~~Store `wordUsageScores` in message document and return to frontend~~
- [x] ~~Update `WordBagOverlay` with visual feedback: green bar + checkmark for used words, orange for partial~~
- [x] ~~Add `wordUsageScores` to frontend `SendMessageResult` type~~
- [ ] Test: Use word from bag correctly, see overlay update; use it incorrectly, see no credit

**Dependencies:** 6.2, 4.2  
**Estimated time:** 45 min

---

## Phase 6B: Edge Cases & Robustness

### 6B.1 Handle Non-Engagement & Off-Topic Messages
**Goal:** Detect when the user isn't engaging meaningfully and steer the conversation  
**Test:** Send gibberish, single-word replies, or completely off-topic messages — AI adapts gracefully

- [x] Add lightweight engagement classification to `messageHandler.ts`:
  - **Gibberish/nonsense**: Message is very short random characters, keyboard smashing, etc.
  - **Minimal effort**: Single word like "ok", "sure", "yeah", "lol", "idk"
  - **Off-topic derailing**: User tries to get the AI to do something unrelated (e.g. "write me an essay", "ignore your instructions")
  - **Hostile/inappropriate**: Profanity or abuse directed at the persona
- [x] Use a simple heuristic check first (message length, dictionary word ratio), NOT an LLM call:
  - Messages under 3 characters or no dictionary words → likely gibberish
  - Messages that are a single common filler word → minimal effort
- [x] Add `engagementHint` field to the AI prompt context:
  - `"low_effort"`: Instruct the AI to gently re-engage — ask a more specific question, share something interesting, don't mirror the low effort
  - `"off_topic"`: Instruct the AI to acknowledge briefly and steer back to a natural topic still amenable to the target words.
  - `"normal"`: No special instructions (default)
- [x] The persona should NEVER lecture the user about engagement — just naturally try harder to be interesting
- [x] LLM and human messages should somehow differently typeface target words (bit like how in iMessage they have fancy sort of animations and looks for certain words)
- [x] LLM messages shouldn't be more than text length. 
- [x] LLM should still try to use target words in every message; earlier instructions were just to make it not too contrived - it doesn't have to use every message in every message, but should aim for at least one and hopefully more because the word bag is carefully chosen. 
- [x] To make things feel a bit more normal, see if can split up messages. Instead of one long message, see if can easily with regex split into several messages -  like sometimes maybe if the text ends with a question as a whole sentence move that into a next message. Or if a text starts with like "I get that", or "Totally." or "Hmm" or something like that (use a heuristic) maybe that should be its own text (that doesn't end with punctuation obviously) and then the next text with the rest of the stuff comes in. Max 3 messages though. 

- [x] Test: Send "asdf", "ok", "write me a poem about dogs" — verify AI handles each gracefully

**Dependencies:** 6.2  
**Estimated time:** 45 min

---

### 6B.2 Guard Against Rapid-Fire / Duplicate Messages
**Goal:** Prevent the user from sending messages faster than the backend can process them  
**Test:** Tap send rapidly 5 times — only one message goes through

- [x] ~~Frontend: `isSending` flag already exists — verify it fully blocks the send button AND the text input `onSubmitEditing`~~
- [x] ~~Frontend: If user taps send while a response is in-flight, silently ignore (no error toast)~~
- [x] ~~Backend: Add idempotency check — if the last user message in the session has identical content AND was sent within 5 seconds, reject as duplicate~~
- [x] ~~Test: Rapidly tap send — verify no duplicate messages in Firestore~~

**Dependencies:** 6.2  
**Estimated time:** 20 min

---

### 6B.3 Handle OpenAI API Failures Gracefully
**Goal:** If the LLM call fails (timeout, rate limit, outage), the user gets a clear retry path  
**Test:** Simulate API failure — see friendly error, can retry

- [x] ~~In `messageHandler.ts`, wrap the `generateChatResponse` call in a try/catch~~
  - ~~On failure: still save the user's message, but return a special `sessionStatus: "error"` with `errorType: "ai_unavailable"`~~
  - ~~Do NOT increment `messageCount` for the failed exchange~~
- [x] ~~In `scoreWordUsage`, failures already return `{}` — verify this is truly non-blocking (it is)~~
- [x] ~~Frontend: If `sessionStatus === "error"`, show a retry button on the last message instead of the AI response~~
  - ~~Tapping retry re-sends the same user message~~
  - ~~Show "Couldn't get a response. Tap to retry." inline, not as a toast~~
- [x] ~~Ensure retry does NOT create a duplicate user message in Firestore~~
- [x] ~~Test: Temporarily use an invalid API key, send a message, verify retry flow~~

**Dependencies:** 6.2  
**Estimated time:** 30 min

---

### 6B.4 Handle Empty Word List Edge Case
**Goal:** Gracefully handle the case where a user's word list is empty or too short  
**Test:** Create a session with a word list that has fewer words than WORD_BAG_SIZE.min

- [x] ~~In `sessionManager.ts`, if word list has fewer words than `WORD_BAG_SIZE.min`:~~
  - ~~Use ALL available words (even if < 3)~~
  - ~~If word list is completely empty, start the conversation with no target words (just a regular conversation)~~
- [x] ~~The AI prompt should handle `wordBag: []` gracefully — no "target words" instruction if empty~~
- [x] ~~Frontend: If word bag is empty, hide the word bag button (or show "No target words for this session")~~
- [x] ~~Test: Create a word list with 1 word, start a session — verify it works~~

**Dependencies:** 5.2, 4.2  
**Estimated time:** 20 min

---

### 6B.5 Session Recovery After App Crash / Close
**Goal:** If the user closes the app mid-conversation and reopens, resume the same session  
**Test:** Start a chat, kill the app, reopen — conversation is restored

- [x] ~~On ChatScreen mount, before creating a new session:~~
  - ~~Check Firestore for an existing `active` session for this user~~
  - ~~If found, reload its messages and word bag instead of creating a new session~~
- [x] ~~Store `lastActiveSessionId` on the user document for quick lookup~~
- [x] ~~Clear `lastActiveSessionId` when session completes~~
- [x] ~~Test: Start chat, send 3 messages, force-close app, reopen — see previous messages~~

**Dependencies:** 6.1, 6.2  
**Estimated time:** 45 min

---

### 6B.6 Validate Session Ownership
**Goal:** Prevent one user from sending messages to another user's session  
**Test:** Attempt to send a message to a session belonging to a different user — get rejected

- [x] ~~In `sendChatMessage` Cloud Function, after fetching session, verify `session.userId === auth.uid`~~
- [x] ~~If mismatch, throw `permission-denied` error~~
- [x] ~~Same check in `createSession` — verify the word list is either a template or belongs to the requesting user~~
- [x] ~~Test: Manually craft a request with wrong sessionId — verify rejection~~

**Dependencies:** 5.5, 5.2  
**Estimated time:** 15 min

---

## Phase 7: Session Completion & Limits

### 7.1 Implement Session Wind-Down Logic
**Goal:** Gracefully end chat when limit approached  
**Test:** Reach message limit, AI naturally concludes conversation

- [x] ~~In `messageHandler.ts`, wind-down is already partially implemented — verify and refine:~~
  - ~~At soft limit (15 messages): append wind-down instruction to the AI prompt~~
  - ~~The AI should wrap up the current thread naturally, not abruptly say "goodbye"~~
  - ~~At hard limit (20 messages): force session completion, stop accepting new messages~~
- [x] ~~Return `shouldWindDown: true` in the response when between soft and hard limit so frontend can show a subtle indicator~~
- [x] ~~Edge case: If user sends a really great message using multiple target words in the wind-down zone, allow 1-2 extra messages as a reward (don't cut off a great exchange)~~
- [x] ~~Test: Have long conversation, verify AI wraps up naturally around message 15-20~~

**Dependencies:** 5.5  
**Estimated time:** 30 min

---

### 7.2 Handle Session Completion in ChatScreen
**Goal:** Show summary and return to dashboard when session ends  
**Test:** Complete session, see word mastery summary, return to dashboard

- [x] ~~In ChatScreen, when `sessionStatus === 'complete'`:~~
  - ~~Disable message input~~
  - ~~Show a completion card (not just a banner) with:~~
    - ~~"Great conversation!" or similar warm message~~
    - ~~Word mastery summary: list each target word with its final usage score (checkmark for mastered, X for unused)~~
    - ~~Total words mastered out of bag size (e.g. "3/4 words used correctly")~~
    - ~~"Return to Dashboard" button~~
- [x] ~~If the user mastered ALL words in the bag, show a special celebration (subtle confetti or a gold star — keep it tasteful)~~
- [x] ~~Edge case: If session completes due to hard limit but user was mid-thought, show "Session wrapped up" rather than "complete"~~
- [x] ~~On button press, navigate to DashboardScreen~~
- [x] ~~Test: Complete a session where you master all words vs. miss some — verify different summaries~~

**Dependencies:** 6.2, 7.1  
**Estimated time:** 45 min

---

### 7.3 Implement Daily Usage Limits with Bonus Chat Gamification
**Goal:** Enforce daily chat limits, but reward mastery with bonus chats  
**Test:** Complete daily limit, master all words in final chat, unlock a bonus chat

- [x] ~~In `sessionManager.ts`, check user's `dailyUsageCount` before creating session~~
- [x] ~~If `lastResetDate` is not today, reset count to 0~~
- [x] ~~**Free tier (1 base chat/day):**~~
  - ~~After completing a chat: if user mastered ALL target words (every word scored >= 6), grant 1 bonus chat~~
  - ~~Bonus chats stack: master the bonus → get another bonus, up to a max of 3 total chats/day~~
  - ~~Store `bonusChatsEarned` and `bonusChatsUsed` on user doc (reset daily)~~
- [x] ~~**Premium tier (5 base chats/day):**~~
  - ~~Same mechanic: master your 5th chat → unlock 6th, master 6th → 7th, up to 8 total/day~~
  - ~~The mastery bar should be high — ALL words in the bag must be scored >= 6~~
- [x] ~~If count >= (base limit + bonusChatsEarned - bonusChatsUsed), return error: "Daily limit reached"~~
- [x] ~~In ChatScreen, if create session fails with limit error:~~
  - ~~Show upgrade prompt overlay (for free users) or "Come back tomorrow" (for premium at max)~~
- [x] ~~After session completes with full mastery, show a celebratory message: "You earned a bonus chat!"~~
- [x] ~~Test: Complete 1 chat as free user mastering all words → verify bonus chat unlocked~~

**Dependencies:** 5.2, 2.2, 7.2  
**Estimated time:** 60 min

---

### 7.4 Create UpgradePrompt Component
**Goal:** Show paywall when limits reached  
**Test:** Trigger limit, see upgrade UI with RevenueCat placeholder

- [x] ~~Create `frontend/src/components/UpgradePrompt.tsx`~~
- [x] ~~Display modal with:~~
  - ~~"You've reached your daily limit" (or "You've used all your chats for today")~~
  - ~~Show how many chats they completed today and words mastered~~
  - ~~Explain the bonus mechanic: "Master all your target words to earn extra chats!"~~
  - ~~Benefits of premium (5 base chats/day, all personas, custom instructions)~~
  - ~~"Upgrade to Premium" button (placeholder for now)~~
  - ~~"Close" button~~
- [x] ~~For premium users at max: show "Come back tomorrow — you've earned your rest!" (positive framing)~~
- [x] ~~Style attractively, not aggressive — should feel encouraging, not punishing~~
- [x] ~~Test: Display component manually, verify both free and premium variants~~

**Dependencies:** 7.3  
**Estimated time:** 30 min

---


## Phase 8: Dashboard & Navigation

### 8.1 Create DashboardScreen Layout
**Goal:** Main hub after onboarding — clean, informative, drives daily engagement  
**Test:** Navigate to dashboard, see sections, feel motivated to start a chat

- [x] ~~Create `frontend/src/screens/dashboard/DashboardScreen.tsx` - Use dashboardMockup.html for this~~
- [x] ~~Layout:~~
  - ~~**Header**: Greeting (time-aware: "Good morning, {name}"), active word list name~~
  - ~~**Daily progress**: Chats used / available, bonus status (from 7.5)~~
  - ~~**Start Chat CTA**: Prominent button or card to start a new conversation — this is the primary action~~
  - ~~**Active Session Indicator**: If there's an active (incomplete) session, show "Resume conversation" instead of "Start new chat"~~
  - ~~**Past Chats**: Collapsible section showing recent completed chats~~
  - ~~**Settings Button**: Navigate to SettingsScreen~~
- [x] ~~Fetch user profile from Firestore~~
- [x] ~~Fetch active word list name~~
- [x] ~~Check for active sessions (for resume flow from 6B.5)~~
- [x] ~~Edge case: First-time user with no past chats — show encouraging "Start your first conversation!" prompt~~
- [x] ~~Test: See dashboard with user info, daily progress, and start chat CTA~~

**Dependencies:** 1.3. 2.2  
**Estimated time:** 60 min

---

### 8.2 ~~Implement Persona Cards~~
**Goal:** Display available personas on dashboard  
**Test:** See Chris card, tap to start chat

- [x] ~~Create `frontend/src/components/PersonaCard.tsx`~~ (integrated into DashboardScreen + PersonaContactCard)
- [x] ~~Display persona avatar, name, tagline, premium lock badge~~
- [x] ~~On tap Chris: Navigate to ChatScreen~~
- [x] ~~On tap locked persona: haptic feedback (upgrade prompt deferred)~~
- [x] ~~In DashboardScreen, render all 4 personas, 3 locked but visible~~
- [x] ~~Info button on each persona opens PersonaContactCard modal~~
- [ ] Edge case: If user has no chats remaining today, tapping should show the limit prompt, not navigate to chat
- [ ] Test: Tap Chris, start chat; tap locked Gemma, see upgrade prompt

**Dependencies:** 8.1, 0.2  
**Estimated time:** 45 min

---

### 8.3 ~~Add Profile/Word List Editor~~
**Goal:** Allow user to change active word list  
**Test:** Tap header, see profile modal, change word list

- [x] ~~In DashboardScreen, make header word list card tappable~~
- [x] ~~Show WordListEditorModal with name input, list selection, word preview chips~~
- [x] ~~On save: update activeWordListId and name in Firestore, close modal~~
- [ ] Edge case: If user's custom word list was deleted or is corrupted, fall back to `template-general`
- [ ] Edge case: Changing word list mid-day doesn't affect active sessions — only new sessions use the new list
- [ ] Test: Change word list, start new chat, verify new words

**Dependencies:** 8.1, 1.3  
**Estimated time:** 45 min

---

### 8.4 ~~Implement Past Chats List (Read-Only)~~
**Goal:** Show completed chat sessions  
**Test:** Complete a chat, see it in past chats list

- [x] ~~In DashboardScreen, fetch completed sessions (limit 20, ordered by completedAt DESC)~~
- [x] ~~Display with persona avatar, name, relative date, word mastery score~~
- [x] ~~Tap to view transcript: PastChatScreen (read-only, no input bar, no word bag)~~
- [x] ~~Empty state: "Your conversations will appear here"~~
- [ ] Edge case: Very long past chats list — implement pagination/infinite scroll (load 10 at a time)
- [ ] Test: View past chat transcript, verify word mastery score shown

**Dependencies:** 8.1, 5.5  
**Estimated time:** 60 min

---

### 8.5 Implement "Words Learned" Summary on Dashboard
**Goal:** Show the user a motivating snapshot of their vocabulary progress  
**Test:** After several chats, see word count and recent mastered words on dashboard

- [ ] Add a small section to DashboardScreen below the daily progress:
  - "X words practiced" total across all sessions
  - "X words mastered" (scored >= 6 at least once)
  - List of 3-5 most recently mastered words as subtle pills/chips
- [ ] Pull from session word bag data (aggregate from completed sessions)
- [ ] This is pre-SRS — just raw counts from session `wordUsageScores`. SRS (Phase 10) will make this richer later.
- [ ] Keep it lightweight — no charts yet, just numbers and a few words
- [ ] Give the user the option to say "learn again" - SRS eventually will do this automatically anyway, but
 the user can add it to their to learn list immediately as well and this will also guide SRS
- [ ] Test: Complete a few chats, see stats update

**Dependencies:** 8.1, 7.2  
**Estimated time:** 30 min

---

## Phase 9: Settings & Preferences

### 9.1 ~~Create SettingsScreen~~
**Goal:** User can customize app preferences  
**Test:** Navigate to settings, change theme, see update

- [x] ~~Create `frontend/src/screens/settings/SettingsScreen.tsx` based on settingsMockup.html~~
- [x] ~~Display grouped settings: Learning (word list link), Preferences (theme, notifications, premium chat bg), Account (upgrade, restore), About (version, privacy, terms, support)~~
- [x] ~~Dashboard gear button navigates to Settings~~
- [ ] Update user preferences in Firestore on change (theme picker not yet interactive)
- [ ] Apply theme change immediately using React Context or state
- [ ] Persist preferences across sessions
- [ ] Edge case: "System" theme option follows device light/dark mode

**Dependencies:** 2.2  
**Estimated time:** 60 min

---

### 9.2 ~~Add Account Management~~
**Goal:** Show user ID, allow account deletion  
**Test:** View account details, test logout flow

- [x] ~~Account section: profile card, subscription badge, Upgrade to Premium, Restore Purchases~~
- [x] ~~Sign Out with confirmation dialog → signOut + navigate to Welcome~~
- [x] ~~Delete Account with double confirmation → signOut + navigate to Welcome~~
- [ ] Full server-side account deletion (Cloud Function to purge user data)
- [ ] Edge case: If user is mid-session when they log out, abandon the session

**Dependencies:** 9.1, 2.2  
**Estimated time:** 30 min

---

## Phase 10: Spaced Repetition System (SRS)

### 10.1 Implement SRS Algorithm
**Goal:** Calculate word bucket progression  
**Test:** Unit test bucket updates

- [ ] Create `backend/functions/src/srs/algorithm.ts`
- [ ] Implement SRS bucket logic:
  - Buckets 0-6 (0 = new word, 6 = mastered)
  - On correct use: increment bucket
  - On missed opportunity: decrement bucket or reset
  - Calculate confidence score: `(bucket / 6) * (correctUses / reviewCount)`
- [ ] Implement `updateWordState(userId, wordListId, word, correctlyUsed)`:
  - Fetch or create SRSState document
  - Update bucket, reviewCount, correctUses, lastReviewed
  - Calculate new confidence
  - Save to Firestore
- [ ] Test: Call function with test data, verify updates

**Dependencies:** 1.1, 5.1  
**Estimated time:** 60 min

---

### 10.2 Implement Word Bag Selection with SRS
**Goal:** Select words based on spaced repetition  
**Test:** Create multiple sessions, verify word variety and review timing

- [ ] Create `backend/functions/src/chat/wordBagSelector.ts`
- [ ] Implement `selectWordBag(userId, wordListId, bagSize)`:
  - Fetch all SRSState docs for user + word list
  - If empty (first time), initialize random words from list
  - Otherwise, select words based on:
    - Priority 1: Words due for review (lastReviewed > X days based on bucket)
    - Priority 2: Words in lower buckets (less mastered)
    - Priority 3: Random words not seen in a while
  - Return array of `bagSize` words
- [ ] Integrate into `createSession` (replace random selection)
- [ ] Test: Create several sessions, verify SRS-based selection

**Dependencies:** 10.1, 5.2  
**Estimated time:** 75 min

---

### 10.3 Update Word State After Each Message
**Goal:** Track word usage and update SRS state  
**Test:** Use word multiple times, verify bucket progression

- [ ] In `sendMessage` Cloud Function:
  - After detecting word usage in user message
  - Call `updateWordState(userId, wordListId, word, true)` for each used word
  - If word in word bag but not used by user after N messages, call with `false`
- [ ] Test: Use a word correctly, verify bucket increases in Firestore
- [ ] Test: Fail to use a word, verify bucket decreases

**Dependencies:** 10.1, 5.5  
**Estimated time:** 30 min

---

### 10.4 Display SRS State in Word Bag Overlay
**Goal:** Show visual confidence indicator for each word  
**Test:** Open word bag, see different styles for mastered vs new words

- [ ] In `WordBagOverlay`, accept `srsStates: SRSState[]` prop
- [ ] For each word, display:
  - Word text
  - Confidence bar or color indicator (0-100%)
  - Bucket level (optional, for debugging)
- [ ] Style words based on confidence:
  - Low confidence: red/orange
  - Medium: yellow
  - High: green
  - Mastered (bucket 6): gold/bold
- [ ] Test: Use words over multiple sessions, watch confidence grow

**Dependencies:** 4.2, 10.3  
**Estimated time:** 30 min

---

## Phase 11: Monetization & Subscriptions

### 11.1 Setup RevenueCat
**Goal:** Initialize RevenueCat SDK  
**Test:** App starts without errors, RevenueCat initialized

- [ ] Create RevenueCat account and project
- [ ] Create product offerings in RevenueCat dashboard:
  - Monthly premium subscription
  - Annual premium subscription
- [ ] Install RevenueCat SDK: `npm install react-native-purchases`
- [ ] Create `frontend/src/services/revenuecat.ts`
- [ ] Initialize RevenueCat with API key in App.tsx
- [ ] Test: Log offerings to console

**Dependencies:** 0.3  
**Estimated time:** 30 min

---

### 11.2 Implement Purchase Flow
**Goal:** Allow users to purchase premium  
**Test:** Trigger purchase (use sandbox), verify subscription

- [ ] In `revenuecat.ts`, implement:
  - `getOfferings()`: Fetch available products
  - `purchasePackage(package)`: Initiate purchase flow
  - `restorePurchases()`: Restore previous purchases
  - `getSubscriptionStatus()`: Check if user is premium
- [ ] Create paywall screen showing offerings
- [ ] On successful purchase:
  - Update user's `tier` to `'premium'` in Firestore
  - Unlock premium personas
  - Close paywall
- [ ] Test: Purchase in sandbox mode, verify tier update

**Dependencies:** 11.1, 2.2  
**Estimated time:** 60 min

---

### 11.3 Integrate Purchase Check into UpgradePrompt
**Goal:** Connect upgrade prompt to RevenueCat  
**Test:** Tap "Upgrade", see paywall, complete purchase, unlock features

- [ ] In `UpgradePrompt`, wire "Upgrade to Premium" button to paywall screen
- [ ] After successful purchase, close prompt and refresh user state
- [ ] Test full flow: hit limit → upgrade → unlock

**Dependencies:** 7.4, 11.2  
**Estimated time:** 20 min

---

### 11.4 Gate Premium Features
**Goal:** Lock premium personas and settings behind paywall  
**Test:** Free user cannot access Gemma/Eva/Sid or custom instructions

- [ ] In DashboardScreen, check user tier:
  - Free users: Show only Chris, lock others with badge
  - Premium users: Show all personas, all unlocked
- [ ] In SettingsScreen:
  - Disable custom instructions input for free users
  - Disable chat background picker for free users
  - Show "Upgrade to unlock" text
- [ ] Test: Switch between free and premium (manually set tier), verify gating

**Dependencies:** 8.2, 9.1, 2.2  
**Estimated time:** 30 min

---

## Phase 12: Push Notifications

### 12.1 Setup Firebase Cloud Messaging
**Goal:** Send push notifications to users  
**Test:** Send test notification from Firebase Console, receive on device

- [ ] Enable Firebase Cloud Messaging in Firebase Console
- [ ] Install Expo notifications: `expo install expo-notifications`
- [ ] Request notification permissions on app launch
- [ ] Register device token with Firebase
- [ ] Store token in user's Firestore document (`notificationToken`)
- [ ] Test: Send test notification from Firebase Console

**Dependencies:** 0.4, 0.5  
**Estimated time:** 45 min

---

### 12.2 Implement Daily Notification Cloud Function
**Goal:** Send daily notification prompting user to chat  
**Test:** Trigger function manually, receive notification

- [ ] Create Cloud Function: `sendDailyNotifications`
- [ ] Scheduled to run once per day (e.g., 9 AM user's timezone)
- [ ] Query users with `notificationToken` set
- [ ] For each user, send notification:
  - Title: "Chris sent you a message"
  - Body: Randomized engaging message (e.g., "Ready to learn some new words?")
  - Data: `{ action: 'openChat', personaId: 'chris' }`
- [ ] Test: Trigger function, receive notification

**Dependencies:** 12.1, 5.1  
**Estimated time:** 60 min

---

### 12.3 Handle Notification Tap
**Goal:** Open chat when user taps notification  
**Test:** Tap notification, app opens to ChatScreen

- [ ] In App.tsx, listen for notification tap event
- [ ] Extract `action` and `personaId` from notification data
- [ ] Navigate to ChatScreen with appropriate persona
- [ ] Test: Tap notification, verify navigation

**Dependencies:** 12.2, 6.1  
**Estimated time:** 30 min

---

## Phase 13: Polish & Optimization

### 13.1 Add Loading States & Error Handling
**Goal:** Improve UX with spinners and error messages  
**Test:** Trigger errors, verify graceful handling

- [ ] Add loading spinners to:
  - ChatScreen while creating session
  - ChatScreen while waiting for AI response
  - DashboardScreen while loading data
- [ ] Add error handling:
  - Network errors: Show retry button
  - API errors: Show friendly message
  - Session creation failures: Show diagnostic info
- [ ] Test: Simulate errors, verify UI response

**Dependencies:** All screens  
**Estimated time:** 60 min

---

### 13.2 Optimize Firestore Queries
**Goal:** Reduce read costs and improve performance  
**Test:** Monitor Firestore usage in console

- [ ] Implement pagination for past chats list (load 10 at a time)
- [ ] Cache template word lists in local storage (avoid repeated fetches)
- [ ] Use Firestore listeners efficiently (unsubscribe on unmount)
- [ ] Add indexes for common queries (see schema.md)
- [ ] Test: Monitor Firestore reads, verify reduction

**Dependencies:** All data-fetching code  
**Estimated time:** 45 min

---

### 13.3 Implement Character Limit on Message Input
**Goal:** Prevent abuse and reduce LLM costs  
**Test:** Type long message, see character count and limit enforcement

- [ ] In ChatScreen, add character counter below input
- [ ] Max characters: 500 (configurable in constants)
- [ ] Disable send button if over limit
- [ ] Show warning text: "Maximum 500 characters"
- [ ] Test: Type 501 characters, verify block

**Dependencies:** 6.2, 0.2  
**Estimated time:** 20 min

---

### 13.4 Optimize AI Prompt Length
**Goal:** Reduce token usage and costs  
**Test:** Monitor OpenAI API usage dashboard

- [ ] In `messageHandler.ts`, limit context window to last 10 messages only
- [ ] Compress older messages into summary if needed
- [ ] Remove unnecessary prompt instructions
- [ ] Use `max_tokens: 150` for AI responses
- [ ] Test: Have long conversation, verify context pruning

**Dependencies:** 5.5, 5.3  
**Estimated time:** 30 min

---

### 13.5 Add Onboarding Tooltips
**Goal:** Guide users through first-time experience  
**Test:** Fresh install, see tooltips on key features

- [ ] Use library like `react-native-walkthrough-tooltip`
- [ ] Add tooltips:
  - Word bag button: "Tap to see your target words"
  - Long-press: "Long-press any word to add to your list"
  - First message: "Your AI friend will use new words naturally"
- [ ] Show only on first use (store in AsyncStorage)
- [ ] Test: Fresh install, verify tooltips appear

**Dependencies:** 4.2, 4.3  
**Estimated time:** 45 min

---

## Phase 14: Testing & QA

### 14.1 Manual Testing Checklist
**Goal:** Verify all features work end-to-end  
**Test:** Follow checklist, fix bugs

- [ ] Test onboarding flow (template + custom list)
- [ ] Test chat creation and conversation
- [ ] Test word bag selection and usage detection
- [ ] Test daily limit enforcement
- [ ] Test session completion and past chats
- [ ] Test settings changes (theme, font size)
- [ ] Test subscription purchase and feature unlocking
- [ ] Test notifications
- [ ] Test on both iOS and Android

**Dependencies:** All features  
**Estimated time:** 120 min

---

### 14.2 Write Unit Tests for Critical Functions
**Goal:** Automated testing for key logic  
**Test:** Run tests, verify pass

- [ ] Write tests for:
  - `wordParser.ts`: Parsing logic
  - `srs/algorithm.ts`: Bucket updates
  - `wordBagSelector.ts`: Word selection
- [ ] Use Jest or similar framework
- [ ] Test: Run `npm test`, all pass

**Dependencies:** 3.3, 10.1, 10.2  
**Estimated time:** 90 min

---

### 14.3 Performance Testing
**Goal:** Ensure app is responsive on low-end devices  
**Test:** Run on slow device/simulator, verify smooth UI

- [ ] Test chat scrolling performance with 50+ messages
- [ ] Test app launch time
- [ ] Profile with React Native performance tools
- [ ] Optimize slow components (memoization, lazy loading)
- [ ] Test: Use low-end Android device, verify no lag

**Dependencies:** All UI components  
**Estimated time:** 60 min

---

## Phase 15: Deployment Prep

### 15.1 Setup Firestore Security Rules
**Goal:** Secure user data in production  
**Test:** Attempt unauthorized access, verify blocked

- [ ] Write comprehensive Firestore rules:
  - Users can read/write only their own documents
  - Word lists are readable by owner (or public for templates)
  - Chat sessions and messages are private to user
  - SRS state is private to user
- [ ] Test rules with Firestore emulator
- [ ] Deploy: `firebase deploy --only firestore:rules`

**Dependencies:** 0.4  
**Estimated time:** 45 min

---

### 15.2 Setup Environment Variables
**Goal:** Separate dev and prod configs  
**Test:** Build app with prod config, verify correct API keys

- [ ] Create `.env.development` and `.env.production` files
- [ ] Store Firebase config, API keys per environment
- [ ] Use Expo's environment variable system
- [ ] Update build scripts to use correct env
- [ ] Test: Build for prod, verify using prod Firebase project

**Dependencies:** 0.3, 0.5  
**Estimated time:** 30 min

---

### 15.3 Build Production APK/IPA
**Goal:** Generate app binaries for distribution  
**Test:** Install on device, verify works without dev server

- [ ] Setup Expo EAS Build:
  - `eas build:configure`
  - Configure iOS and Android builds
- [ ] Run builds: `eas build --platform all`
- [ ] Download and install on test devices
- [ ] Test: App works independently of dev machine

**Dependencies:** 0.3, 15.2  
**Estimated time:** 60 min

---

### 15.4 Submit to App Stores (MVP Release)
**Goal:** Publish app to Apple App Store and Google Play Store  
**Test:** App is live and downloadable

- [ ] Prepare App Store assets:
  - Screenshots (multiple device sizes)
  - App icon
  - Description, keywords
  - Privacy policy
- [ ] Submit iOS app to App Store Connect
- [ ] Submit Android app to Google Play Console
- [ ] Wait for review and approval

**Dependencies:** 15.3  
**Estimated time:** 180 min (plus review wait time)

---

---

## 🎉 **MVP COMPLETE** 🎉

At this point, Verbalist v1.0 is live with:
- Full onboarding flow (template + custom word lists)
- Real-time chat with Chris persona
- LLM-scored word usage detection (quality, not just presence)
- Word bag selection with basic SRS
- Session limits with bonus chat gamification (master words → earn extra chats)
- Dashboard with past chats and daily progress
- Settings and preferences
- Free tier (1 base chat/day + bonus) and premium tier (5 base + bonus up to 8, all personas)
- Push notifications
- Deployed to app stores

---

## Phase 16: Post-MVP Enhancements (Optional/Future)

### 16.1 Add Email/Password Authentication
**Goal:** Allow users to create accounts with email  
**Test:** Sign up with email, log in, data persists

- [ ] Enable email/password provider in Firebase Auth
- [ ] Add email/password sign-up screen
- [ ] Link anonymous accounts to email on upgrade
- [ ] Test: Sign up, log out, log back in

**Dependencies:** 2.1  
**Estimated time:** 60 min

---

### 16.2 Implement Gemma, Eva, Sid Personas
**Goal:** Add premium personas with unique styles  
**Test:** Chat with each persona, verify distinct voices

- [ ] Enable personas in DashboardScreen for premium users
- [ ] Test each persona prompt template
- [ ] Adjust prompts based on user feedback
- [ ] Test: Chat with Gemma about Shakespeare, verify literary style

**Dependencies:** 5.4, 11.4  
**Estimated time:** 90 min

---

### 16.3 Add Word List Management Screen
**Goal:** Allow editing custom word lists  
**Test:** Edit list, add/remove words, verify updates

- [ ] Create word list editor screen
- [ ] Allow adding individual words
- [ ] Allow deleting words from list
- [ ] Allow renaming list
- [ ] Test: Edit list, start new chat, verify new words

**Dependencies:** 3.3, 1.3  
**Estimated time:** 60 min

---

### 16.4 Implement Advanced SRS Analytics
**Goal:** Show user progress and word mastery stats  
**Test:** View dashboard, see charts of progress

- [ ] Create analytics screen showing:
  - Total words learned
  - Words by bucket/mastery level
  - Daily learning streak
  - Most improved words
- [ ] Use chart library (e.g., Victory Native)
- [ ] Test: Display mock data, verify charts render

**Dependencies:** 10.1, 8.1  
**Estimated time:** 90 min

---

### 16.5 Add Social Features (Share Progress)
**Goal:** Let users share achievements  
**Test:** Share screenshot of word mastery

- [ ] Implement share functionality using Expo Sharing API
- [ ] Generate shareable image with stats
- [ ] Test: Share to social media, verify image looks good

**Dependencies:** 16.4  
**Estimated time:** 60 min

---

### 16.6 Implement Alternative Conversation Formats
**Goal:** Add email-style exchanges (mentioned in requirements)  
**Test:** Start email-style chat, verify longer-form messages

- [ ] Create new conversation mode: "Email Exchange"
- [ ] Adjust prompts for longer, more formal messages
- [ ] Test: Compare chat vs email modes

**Dependencies:** 5.4, 6.1  
**Estimated time:** 60 min

---

### 16.7 Add Offline Mode
**Goal:** Cache data for offline use  
**Test:** Disconnect internet, app still works (view past chats)

- [ ] Cache user data, word lists, past chats in AsyncStorage
- [ ] Show offline indicator when no connection
- [ ] Queue messages for sending when back online
- [ ] Test: Turn off internet, navigate app

**Dependencies:** 1.3, 8.4  
**Estimated time:** 90 min

---

## Summary

**Total tasks:** 70+  
**MVP Completion:** After Phase 15 (Task 15.4)  
**Estimated MVP Time:** 60-80 hours (depending on developer speed)

This task list is designed for incremental development with frequent testing. Each phase builds on the previous, allowing for early validation and course correction.