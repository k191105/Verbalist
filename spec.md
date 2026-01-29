Verbalist is a vocabulary app that actually teaches you words through conversation.It uses LLMs to have conversations with the user where the user is meant to use the word they’re trying to learn. This way you learn not only the word but also  adjacent usage in context. For instance if I wanted to learn the word ecclesiastical it would talk to me and we’d use that word a lot and eventually I’d master it. Like a very well read friend or colleague that uses the words you want to learn a lot. 

Verbalist is a mobile-first conversational language-learning application centered on natural dialogue rather than explicit drills. The core interaction is an iMessage-style chat with an AI persona, where vocabulary acquisition happens implicitly through use, repetition, and contextual reinforcement. The app is designed so that learning feels like texting a sharp, articulate peer, not completing exercises.


A new user begins with a guided onboarding sequence. The onboarding first explains, briefly and plainly, what Verbalist does: it helps the user expand and internalize vocabulary by chatting, with the system quietly steering the conversation toward a small set of target words. The user is then prompted to choose a word list. Initially, the app offers three templated word lists, stored centrally and versioned (for example: “General High-Level Vocabulary,” “Literary and Rhetorical,” “Politics and Public Life”). These lists are selectable with a single tap and immediately usable. Alongside these is an option to create a custom word list.



If the user selects a templated list, onboarding completes and the app transitions directly into the chat experience. If the user selects a custom word list, they are taken to a dedicated word-list creation screen. This screen is visually clean and focused: a large text input where the user can type or paste words freely, with generous spacing and minimal chrome. As the user types or pastes content, the app runs a lightweight parsing routine that splits input into individual words, trims whitespace and punctuation, normalizes casing, and de-duplicates entries. Parsed words are displayed as pills or chips below the input, giving immediate visual feedback that the list is being constructed correctly. A progress indicator (for example, a bar at the top) shows how many words have been added relative to a minimum threshold required to start using the app. Until this threshold is met, the “Done” action is disabled or visually de-emphasized. At any point during this flow, the user can return to the previous screen and choose a templated list instead. Once the minimum word count is reached, the user can confirm the list, triggering a short loading animation while the backend prepares the first session.



After onboarding, app launch always resolves into an active chat view. The primary UI is deliberately sparse: a full-screen chat interface closely resembling iMessage, with bubbles, timestamps, and typing indicators. kay. Now that onboarding is done the user is launched into the app. Main UI of app is very very simple. Just a clean imessage kind of chat screen where the LLM already delivers the first message. We'll have four personas the user can chat with - Chris, Gemma, Eva , Sid - each with their advantages. Chris the default model (in future only model available to free users), Sid very knowledgeable in history and politics; Gemma very good at literature and the arts; Eva very well read in philosophy and psychology. Premium users in future will have access to Gemma, Eva and Sid. Anyway: for now, user is launched into chat with Chris. Screen opens with short iMessage style typing animation and Chris delivers the first message - make it sound natural, not completely random, like a peer would text you, like a real conversational hook rather than a prompt or instruction. Prompt engineering here is critical: the first message should subtly incorporate or gesture toward one or two target words without making their presence obvious.



Behind the scenes, the backend maintains a spaced-repetition system that selects a small “bag” of three to five words for the current chat session from the active word list. This bag is not shown persistently on screen. Instead, it is accessible via a contextual UI element: for example, a button near the text input that reveals a temporary overlay or “island” containing the current target words. Dismissing the overlay returns the user to the uninterrupted chat. Each word in the bag is visually styled to reflect the system’s confidence in the user’s mastery, using subtle typographic cues such as weight, opacity, or color. As the user successfully uses a word in context and the system updates its internal learning signal, this styling changes in real time.



The chat interface supports standard text interactions: selecting and copying text behaves as expected. In addition, long-pressing on a word opens a contextual action sheet with the option to add that word to the active word list. This allows organic vocabulary expansion without breaking conversational flow. The top navigation bar mirrors common messaging apps: a back arrow on the top left returns the user to the dashboard, and a settings icon on the top right opens app settings.

Settings provide customization and account management. Users can adjust chat background, theme, and font, with all premium features gated but fully scaffolded from the start. The settings area also includes an about page, privacy policy, restore purchases, and other standard utilities. Infrastructure should anticipate future features, such as alternative conversation formats (e.g. email-style exchanges), even if these are not yet exposed.



Pressing the back arrow from chat opens the main dashboard. The dashboard begins with a profile and active word list section, showing the user’s name and current list. Tapping into this section allows the user to edit profile details, set optional custom instructions (premium), and change their active word list. Changing the word list here affects all future chats.



Below this is the active chats section. Free users see a single contact (Chris). Premium users will eventually see all four personas—Chris, Gemma, Eva, and Sid—each representing a distinct conversational and intellectual focus. Each persona maintains its own conversation history and its own SRS state. Tapping a contact resumes the most recent active conversation with that persona. If a conversation was left mid-session, the user is returned to it. If the previous session is complete, a new conversation is started seamlessly.



Below active chats is a collapsible list of past chats. These are read-only transcripts that the user can revisit but not continue. The distinction between active and completed chats is handled entirely by backend session state.



Conversation length is bounded, though these limits are abstracted away from the user as much as possible. Internally, each chat has a soft wind-down phase beginning around a configurable message count, and a hard end shortly thereafter. As the session concludes, the agent naturally tapers the exchange rather than abruptly stopping. After completion, the user is shown a brief summary screen indicating progress and word mastery, though this flow is intentionally tentative and may be revised to avoid making chats feel like exercises.



Usage limits are enforced at the session level. Free users can complete up to two chats per day; premium users up to eight. Additionally, all users are subject to per-message character and word limits to prevent abuse. As users approach these limits while typing, the UI provides subtle feedback. When a free user exceeds daily limits, attempts to start a new chat or re-enter the app result in a clear upgrade prompt.



Notifications delivered once a day with something like 'Chris sent you a message' or similar; tapping takes user into the chat. Stack would involve React Native likely Expo, Firebase, RevenueCat, OpenAI API (for now) - later also Claude maybe for Gemma persona (only if economics works out). Using LLM for selecting bag of words - use cheapest LLM for this, then another cheap LLM for chat, maybe 4o-mini. Firebase has a generous free tier and is built for React Native and mobile apps. Pricing also better. Push notifications and mobile specific features also built in. In development cost should be nearly free other than LLM costs. 