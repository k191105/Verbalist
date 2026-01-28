# Verbalist Architecture

## Overview

Verbalist is a mobile-first vocabulary learning app built with React Native (Expo), Firebase, and OpenAI. The architecture follows a clear separation between frontend (React Native), backend (Firebase Cloud Functions), and shared configuration.

## Technology Stack

- **Frontend**: React Native (Expo)
- **Chat UI**: react-native-gifted-chat
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Navigation**: React Navigation
- **Payments**: RevenueCat
- **LLM**: OpenAI API (gpt-4o-mini for chat, gpt-3.5-turbo for word selection)
- **Push Notifications**: Firebase Cloud Messaging (built into Firebase)

## Project Structure

```
verbalist/
├── README.md
├── package.json
├── app.json                    # Expo configuration
├── .gitignore
├── schema.md                      # Move these files
├── spec.md                    
├── tasks.md
├── architecture.md
├── frontend/                      # React Native (Expo) app
│   ├── src/
│   │   ├── screens/              # Screen components
│   │   │   ├── onboarding/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── WordListSelectionScreen.tsx
│   │   │   │   └── CustomWordListScreen.tsx
│   │   │   ├── chat/
│   │   │   │   └── ChatScreen.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardScreen.tsx
│   │   │   └── settings/
│   │   │       └── SettingsScreen.tsx
│   │   ├── components/           # Reusable components
│   │   │   ├── WordBagOverlay.tsx
│   │   │   ├── PersonaCard.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── UpgradePrompt.tsx
│   │   ├── navigation/           # Navigation config
│   │   │   └── RootNavigator.tsx
│   │   ├── services/             # API & Firebase interactions
│   │   │   ├── firebase.ts       # Firebase initialization
│   │   │   ├── auth.ts           # Authentication logic
│   │   │   ├── firestore.ts      # Firestore queries
│   │   │   ├── chat.ts           # Chat session management
│   │   │   └── revenuecat.ts     # Subscription management
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   └── useSubscription.ts
│   │   ├── types/                # TypeScript definitions
│   │   │   └── index.ts
│   │   └── utils/                # Helper functions
│   │       ├── wordParser.ts     # Parse custom word lists
│   │       └── formatting.ts     # Text formatting utilities
│   ├── assets/                   # Images, fonts
│   ├── App.tsx                   # Root component
│   └── app.json                  # Expo config
│
├── backend/                       # Firebase Cloud Functions
│   ├── functions/
│   │   ├── src/
│   │   │   ├── chat/
│   │   │   │   ├── sessionManager.ts    # Chat session lifecycle
│   │   │   │   ├── messageHandler.ts    # Process incoming messages
│   │   │   │   └── wordBagSelector.ts   # SRS-based word selection
│   │   │   ├── llm/
│   │   │   │   ├── openai.ts            # OpenAI API wrapper
│   │   │   │   └── prompts.ts           # Persona prompts & templates
│   │   │   ├── srs/
│   │   │   │   └── algorithm.ts         # Spaced repetition logic
│   │   │   └── index.ts                 # Cloud Functions entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── firestore.rules            # Security rules
│
└── shared/                        # Shared configuration & types
    ├── config/
    │   ├── constants.ts           # App-wide constants
    │   │   # - Message limits (free: 2/day, premium: 8/day)
    │   │   # - Character limits per message
    │   │   # - Word bag size (3-5 words)
    │   │   # - SRS intervals
    │   │   # - Theme colors
    │   ├── personas.ts            # Persona definitions (Chris, Gemma, Eva, Sid)
    │   └── wordLists.ts           # Template word lists
    └── secrets.example.ts         # Template for API keys (not committed)
```

## Data Flow

### 1. User Authentication
```
User → Frontend (Auth Screen) → Firebase Auth → Firestore (User Doc) → Frontend (Context)
```

### 2. Chat Session Flow
```
User starts chat → Frontend → Cloud Function (createSession)
                                      ↓
                              Select word bag (LLM)
                                      ↓
                              Create session doc in Firestore
                                      ↓
                              Return session + first message
                                      ↓
                              Frontend displays chat
```

### 3. Message Exchange
```
User sends message → Frontend → Cloud Function (sendMessage)
                                      ↓
                              Update SRS state
                                      ↓
                              Call OpenAI with context + word bag
                                      ↓
                              Store message in Firestore
                                      ↓
                              Return AI response
                                      ↓
                              Frontend appends to chat
```

### 4. Session Completion
```
Message count reaches limit → Cloud Function marks session complete
                                      ↓
                              Calculate word mastery progress
                                      ↓
                              Frontend shows summary (optional)
                                      ↓
                              Return to dashboard
```

## State Management

### Frontend State (React Context + Local State)

1. **AuthContext**
   - Current user
   - Authentication status
   - Login/logout handlers

2. **ChatContext** (or local state in ChatScreen)
   - Current messages (Gifted Chat format)
   - Active session ID
   - Word bag for current session
   - Typing indicator

3. **SubscriptionContext**
   - User tier (free/premium)
   - Daily usage count
   - RevenueCat entitlements

### Backend State (Firestore)

All persistent state lives in Firestore:
- User profiles
- Word lists
- Chat sessions
- Messages (minimal, only what's needed for context)
- SRS state per word per user

## Service Connections

### Frontend → Firebase Auth
- Sign up / Sign in (anonymous initially, can add email later)
- Token refresh handled by Firebase SDK

### Frontend → Firestore (Direct Reads)
- Read user profile
- Read word lists
- Read chat sessions
- Listen to new messages in active session (real-time)

### Frontend → Cloud Functions (via HTTPS/Callable)
- `createSession`: Initialize new chat with word bag
- `sendMessage`: Send user message, get AI response
- `addWordToList`: Add word from chat to active list
- `updateWordListSelection`: Change active word list

### Cloud Functions → OpenAI API
- Word bag selection (cheap model: gpt-3.5-turbo)
- Chat conversation (gpt-4o-mini)
- Prompt engineering for personas

### Cloud Functions → Firestore (Writes)
- Create/update sessions
- Store messages
- Update SRS state
- Track usage limits

### Frontend → RevenueCat
- Check subscription status
- Purchase flow
- Restore purchases

### Frontend → Firebase Cloud Messaging
- Register device token
- Cloud Function sends daily notification
- User taps → Deep link to chat

## Security

- Firebase Auth handles user authentication
- Firestore rules enforce:
  - Users can only read/write their own data
  - Word lists are either public (template) or user-owned
  - Cloud Functions run with admin privileges
- API keys stored in Cloud Functions environment (not in frontend)
- RevenueCat verifies purchases server-side

## Cost Optimization

1. **Firestore**
   - Store only active chat sessions (archive old ones)
   - Don't duplicate template word lists per user (reference by ID)
   - Minimize message storage (only last N messages for context)

2. **LLM Costs**
   - Use gpt-3.5-turbo for word selection (cheapest)
   - Use gpt-4o-mini for chat (balance of cost/quality)
   - Limit message length to reduce tokens
   - Compress context window (don't send entire chat history)

3. **Cloud Functions**
   - Use Firebase's free tier (125K invocations/month)
   - Optimize function memory/timeout

4. **Storage**
   - Don't store unnecessary metadata
   - Archive completed sessions to cheaper storage after X days

## Development vs Production

- **Dev**: Use Firebase Emulator Suite locally
- **Prod**: Deploy Cloud Functions + Firestore rules via Firebase CLI
- Secrets managed via Firebase Functions config or environment variables
- Expo EAS for app builds and OTA updates