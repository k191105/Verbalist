# Verbalist Chat UI Specification

## Executive Summary

This document provides complete specifications for building a custom chat interface for Verbalist in React Native. After thorough research, we've determined that **building a custom chat UI is the optimal approach** rather than using existing libraries like react-native-gifted-chat or ChatKit.

---

## Research: Why Not Use Existing Chat Libraries?

### Libraries Evaluated

**1. react-native-gifted-chat**
- **What it is:** Most popular React Native chat UI library (14k+ stars)
- **Designed for:** Human-to-human messaging applications
- **Pros:**
  - Battle-tested, widely used
  - Good documentation
  - Handles auto-scrolling, typing indicators, message grouping
  
- **Cons for our use case:**
  - ❌ Designed for user-to-user chat (not AI conversations)
  - ❌ Requires user objects with avatars, IDs, etc. (unnecessary complexity)
  - ❌ Default styling doesn't match iOS Messages aesthetic
  - ❌ Would require significant customization to achieve our design
  - ❌ Includes features we don't need (avatars, "seen" indicators, user lists)
  - ❌ Makes it harder to switch LLM providers per persona
  - ❌ The API fights you when you want simple message→LLM→response flow

**2. ChatKit.js (OpenAI)**
- **What it is:** NEW framework announced recently for building ChatGPT-style interfaces
- **Designed for:** Web (React/vanilla JS), NOT React Native
- **Verdict:** ❌ Not applicable - web-only, not mobile

**3. CometChat / Stream Chat / SendBird**
- **What they are:** Enterprise chat platforms with proprietary backends
- **Designed for:** Full chat infrastructure (channels, users, presence, etc.)
- **Cons for our use case:**
  - ❌ Require their paid backend services
  - ❌ Lock you into their ecosystem
  - ❌ Massive overkill for AI→user conversations
  - ❌ We already have Firebase for our backend
  - ❌ Would pay for features we'll never use

### Decision: Build Custom Chat UI

**Why this is the right choice:**

✅ **Full Design Control**
- We can perfectly replicate iOS Messages aesthetic
- Custom bubble shapes, tails, spacing exactly as designed
- No fighting against library defaults

✅ **Simple Data Model**
- Just an array of messages: `{ role: 'user' | 'assistant', content: string, timestamp: Date }`
- No need for user objects, avatars, or complex state

✅ **LLM Provider Flexibility**
- Chris uses GPT-4o-mini
- Gemma could use Claude Sonnet
- Eva might use GPT-4
- Easy to switch per persona without library constraints

✅ **Lightweight & Performant**
- Only what we need, no bloat
- Direct FlatList implementation
- Optimal for our specific use case

✅ **Custom Features**
- Word highlighting (bolding target words)
- Word bag button with island UI
- Multi-day sessions with date separators
- Session wind-down behavior
- Easy to add features without library constraints

✅ **Learning from Open Source**
- We can study Gifted Chat's source code for ideas
- Copy patterns like auto-scroll, typing indicator
- But implement them exactly for our needs

---

## iOS Messages Design Research

### Key Visual Characteristics

**Message Bubbles:**
- **User (sent) messages:**
  - Color: Blue (#007AFF - iOS blue)
  - Alignment: Right side
  - Max width: ~70% of screen
  - Border radius: 18px
  - Tail: Bottom-right corner (4px radius)
  - Font: San Francisco (we'll use Crimson Pro)
  - Text color: White

- **Received messages:**
  - Color: Light gray (#E5E5EA)
  - Alignment: Left side
  - Max width: ~70% of screen
  - Border radius: 18px
  - Tail: Bottom-left corner (4px radius)
  - Text color: Black

**Message Grouping:**
- Consecutive messages from same sender are grouped
- 2px gap between messages in same group
- 8px gap between different senders
- Time stamps shown for each group (not every message)

**Bubble Tails:**
- Created using border-radius asymmetry
- Bottom-left corner: 4px for AI messages
- Bottom-right corner: 4px for user messages
- Other corners: 18px

**Date Separators:**
- Centered text
- Small gray font (13px)
- Appears when day changes
- Format: "Today", "Yesterday", "Monday, Jan 20"

**Header:**
- Blurred white background
- Contact name centered and tappable
- Back button (chevron) on left
- More options (•••) on right
- Subtitle shows additional context

---

## Complete Chat UI Specification

### Screen Layout

```
┌────────────────────────────────────┐
│ ‹  Chris           ⓘ        •••   │ ← Header (blurred white)
│    General High-Level              │
├────────────────────────────────────┤
│                                    │
│     Thursday, January 29           │ ← Date separator
│                                    │
│  ┌──────────────────────────┐     │
│  │ Hey! Ready to explore    │     │ ← AI message (gray)
│  │ ubiquitous technology?   │     │
│  └──────────────────────────┘     │
│  2:14 PM                           │
│                                    │
│           ┌────────────────┐      │
│           │ Yeah, it has!  │      │ ← User message (blue)
│           └────────────────┘      │
│                      2:15 PM      │
│                                    │
│  ┌──────────────────────────┐     │
│  │ That's pervasive...      │     │
│  └──────────────────────────┘     │
│  ┌──────────────────────────┐     │ ← Multiple messages
│  │ Do you think...          │     │   from same sender
│  └──────────────────────────┘     │
│  2:15 PM                           │
│                                    │
│  ● ● ●                             │ ← Typing indicator
│                                    │
├────────────────────────────────────┤
│ ┌─────────────────────────────┐  │
│ │ ≡  Message           ↑      │  │ ← Input (white bg)
│ └─────────────────────────────┘  │
└────────────────────────────────────┘

Word Bag Island (pops up above input):
     ┌─────────────────┐
     │ ubiquitous  ████│ 80%
     │ pervasive   ███░│ 60%
     │ judicious   ██░░│ 45%
     │ ephemeral   █░░░│ 20%
     └─────────────────┘
           ▼
```

### Header Component

**Container:**
- Background: rgba(255, 255, 255, 0.95)
- Backdrop filter: Blur 20px (iOS-style translucency)
- Padding: 60px top (status bar), 16px horizontal, 12px bottom
- Border bottom: 0.5px solid rgba(0, 0, 0, 0.08)
- Position: Fixed to top

**Layout:**
```
<View style={headerContainer}>
  <View style={headerTop}>
    <TouchableOpacity style={backButton}>
      <Text>‹</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={personaInfo} onPress={showPersonaModal}>
      <Text style={personaName}>Chris</Text>
      <Text style={personaSubtitle}>General High-Level</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={moreButton}>
      <Text>•••</Text>
    </TouchableOpacity>
  </View>
</View>
```

**Styles:**

```javascript
const headerContainer = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  paddingTop: 60, // Include status bar
  paddingHorizontal: 16,
  paddingBottom: 12,
  borderBottomWidth: 0.5,
  borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  // iOS blur effect (React Native doesn't have backdrop-filter)
  // Use BlurView from '@react-native-community/blur'
}

const backButton = {
  paddingHorizontal: 8,
  paddingVertical: 4,
}

const backText = {
  fontSize: 32,
  fontWeight: '300',
  color: '#007AFF',
}

const personaInfo = {
  flex: 1,
  alignItems: 'center',
}

const personaName = {
  fontFamily: 'DMSerifDisplay-Regular',
  fontSize: 17,
  fontWeight: '600',
  color: '#0F1939',
  marginBottom: 2,
}

const personaSubtitle = {
  fontSize: 12,
  color: '#8E8E93',
}

const moreButton = {
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
}
```

### Messages Area

**Container:**
- Component: FlatList (for performance with many messages)
- Inverted: true (latest messages at bottom)
- Padding: 12px horizontal, 16px vertical
- Background: #F6F3E7 (Rapture's Light)
- keyboardDismissMode: 'interactive'
- keyboardShouldPersistTaps: 'handled'

**Data Structure:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  wordUsage?: string[]; // Words from bag used in this message
}

interface MessageGroup {
  date: Date; // For date separator
  messages: Message[];
  role: 'user' | 'assistant';
}
```

**Message Grouping Logic:**
```javascript
// Group consecutive messages from same sender
function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;
  
  messages.forEach((msg, index) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const sameDay = prevMsg && isSameDay(msg.timestamp, prevMsg.timestamp);
    const sameSender = prevMsg && msg.role === prevMsg.role;
    
    // New group if different day or different sender
    if (!sameSender || !sameDay) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        date: msg.timestamp,
        messages: [msg],
        role: msg.role,
      };
    } else {
      currentGroup.messages.push(msg);
    }
  });
  
  if (currentGroup) groups.push(currentGroup);
  return groups;
}
```

**Message Bubble Component:**

```javascript
const MessageBubble = ({ message, isUser }) => {
  return (
    <View style={[
      styles.bubble,
      isUser ? styles.bubbleUser : styles.bubbleAssistant
    ]}>
      <Text style={[
        styles.bubbleText,
        isUser ? styles.textUser : styles.textAssistant
      ]}>
        {renderTextWithHighlights(message.content, message.wordUsage)}
      </Text>
    </View>
  );
};

// Render text with bold target words
function renderTextWithHighlights(text: string, words?: string[]) {
  if (!words || words.length === 0) {
    return text;
  }
  
  // Split text and wrap target words in <Text> with bold
  const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    const isTargetWord = words.some(w => 
      w.toLowerCase() === part.toLowerCase()
    );
    return (
      <Text key={i} style={isTargetWord ? { fontWeight: '600' } : {}}>
        {part}
      </Text>
    );
  });
}
```

**Bubble Styles:**

```javascript
const styles = StyleSheet.create({
  bubble: {
    maxWidth: '70%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginVertical: 1, // 2px gap between messages in group
  },
  
  bubbleAssistant: {
    backgroundColor: '#E5E5EA', // iOS gray
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 4, // Tail
  },
  
  bubbleUser: {
    backgroundColor: '#007AFF', // iOS blue
    alignSelf: 'flex-end',
    borderRadius: 18,
    borderBottomRightRadius: 4, // Tail
  },
  
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'CrimsonPro-Regular',
  },
  
  textAssistant: {
    color: '#0F1939',
  },
  
  textUser: {
    color: '#FFFFFF',
  },
});
```

**Date Separator:**

```javascript
const DateSeparator = ({ date }) => {
  const dateString = formatDateForSeparator(date);
  
  return (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateText}>{dateString}</Text>
    </View>
  );
};

function formatDateForSeparator(date: Date): string {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = subDays(today, 1);
  
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  
  // Format as "Monday, January 20"
  return format(date, 'EEEE, MMMM d');
}

const styles = StyleSheet.create({
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'CrimsonPro-Regular',
  },
});
```

**Time Stamp:**

```javascript
const TimeStamp = ({ timestamp }) => {
  return (
    <Text style={styles.timestamp}>
      {format(timestamp, 'h:mm a')}
    </Text>
  );
};

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    marginHorizontal: 4,
    fontFamily: 'CrimsonPro-Regular',
  },
});
```

**Typing Indicator:**

```javascript
const TypingIndicator = () => {
  // Animate three dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -6,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    animate(dot1Anim, 0);
    animate(dot2Anim, 200);
    animate(dot3Anim, 400);
  }, []);
  
  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[
        styles.typingDot,
        { transform: [{ translateY: dot1Anim }] }
      ]} />
      <Animated.View style={[
        styles.typingDot,
        { transform: [{ translateY: dot2Anim }] }
      ]} />
      <Animated.View style={[
        styles.typingDot,
        { transform: [{ translateY: dot3Anim }] }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
  },
});
```

### Input Area

**Container:**
- Background: rgba(255, 255, 255, 0.95)
- Backdrop filter: Blur 20px
- Padding: 8px horizontal, 8px top, 32px bottom (safe area)
- Border top: 0.5px solid rgba(0, 0, 0, 0.08)
- Position: Fixed to bottom
- Use KeyboardAvoidingView to push up when keyboard appears

**Layout:**
```
<KeyboardAvoidingView behavior="padding">
  <View style={inputAreaContainer}>
    <View style={inputContainer}>
      <TouchableOpacity style={wordBagButton} onPress={toggleWordBag}>
        <Icon name="list" />
      </TouchableOpacity>
      
      <TextInput
        style={messageInput}
        placeholder="Message"
        multiline
        value={message}
        onChangeText={setMessage}
        onContentSizeChange={handleContentSizeChange}
      />
      
      <TouchableOpacity
        style={sendButton}
        onPress={sendMessage}
        disabled={!message.trim()}
      >
        <Text>↑</Text>
      </TouchableOpacity>
    </View>
  </View>
</KeyboardAvoidingView>
```

**Styles:**

```javascript
const styles = StyleSheet.create({
  inputAreaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 32, // Account for home indicator
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  
  wordBagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'CrimsonPro-Regular',
    color: '#0F1939',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
    maxHeight: 120,
  },
  
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
});
```

**Auto-growing TextInput:**

```javascript
const [inputHeight, setInputHeight] = useState(32);

const handleContentSizeChange = (event) => {
  const newHeight = Math.min(
    Math.max(32, event.nativeEvent.contentSize.height),
    120
  );
  setInputHeight(newHeight);
};
```

### Word Bag Island

**Container:**
- Position: Absolute, above input area
- Left: 16px from screen edge
- Bottom: 80px from screen edge
- Background: White
- Border radius: 16px
- Shadow: iOS-style (0px 8px 32px rgba(0, 0, 0, 0.12))
- Min width: 200px
- Animated slide up entrance

**Arrow Pointer:**
- Small triangle pointing down to word bag button
- Created using rotated square div
- Position: bottom -6px, left 20px

**Word List:**

```javascript
const WordBagIsland = ({ words, visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.island,
          {
            opacity: slideAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            }],
          },
        ]}>
          <View style={styles.arrow} />
          
          <View style={styles.wordList}>
            {words.map((word, index) => (
              <WordItem key={index} word={word} />
            ))}
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const WordItem = ({ word }) => {
  return (
    <View style={styles.wordItem}>
      <Text style={styles.wordText}>{word.text}</Text>
      <View style={styles.confidenceBar}>
        <View style={[
          styles.confidenceFill,
          { width: `${word.confidence * 100}%` }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  island: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  
  arrow: {
    position: 'absolute',
    bottom: -6,
    left: 20,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  
  wordList: {
    gap: 8,
  },
  
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F6F3E7',
    borderRadius: 10,
  },
  
  wordText: {
    fontFamily: 'DMSerifDisplay-Regular',
    fontSize: 15,
    color: '#0F1939',
  },
  
  confidenceBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  confidenceFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
```

### Word Bag Button Icon

**Use SVG, not emoji:**

```javascript
import Svg, { Path } from 'react-native-svg';

const WordBagIcon = ({ color = '#007AFF', size = 20 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 6h12M4 10h12M4 14h12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};
```

**Alternative icon (bookmark):**
```javascript
<Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
  <Path
    d="M5 3a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V3z"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</Svg>
```

---

## Persona Info Modal

**Triggered by:** Tapping persona name in header

**Design:**
- Bottom sheet (slides up from bottom)
- Blurred background overlay
- White content area with rounded top corners

**Content:**
```
┌────────────────────────────┐
│                            │
│         [Avatar]           │ Large circular avatar
│                            │
│          Chris             │ Persona name
│        Versatile           │ Expertise tag
│                            │
│  Chris is your general     │ Description paragraph
│  conversational partner... │
│                            │
│  [Change Active List]      │ Button
│                            │
│  [Close]                   │ Close button
└────────────────────────────┘
```

---

## Implementation Checklist

### Core Functionality
- [ ] FlatList with inverted prop for messages
- [ ] Message grouping logic
- [ ] Date separator rendering
- [ ] Message bubble component with tail
- [ ] Target word highlighting (bold)
- [ ] Typing indicator animation
- [ ] Auto-growing TextInput
- [ ] Word bag island with animations
- [ ] Send button enable/disable logic
- [ ] KeyboardAvoidingView setup
- [ ] Auto-scroll to bottom on new message

### Polish
- [ ] Smooth animations (60fps)
- [ ] Haptic feedback on send
- [ ] Blurred header (iOS style)
- [ ] Proper safe area handling
- [ ] Loading states
- [ ] Error handling
- [ ] Offline message queue
- [ ] Character limit indicator

### Testing
- [ ] Test on various screen sizes
- [ ] Test with long messages
- [ ] Test keyboard behavior
- [ ] Test word bag island positioning
- [ ] Test multi-day conversations
- [ ] Test message grouping logic
- [ ] Performance with 100+ messages

---

## Future Enhancements

1. **Message Reactions:** Long-press to add emoji reactions
2. **Message Search:** Search within conversation history
3. **Voice Input:** Speak messages instead of typing
4. **Message Copying:** Long-press to copy text
5. **Link Detection:** Make URLs tappable
6. **Image Support:** Send/receive images (if needed for word definitions)
7. **Message Effects:** Send with animations (iMessage-style)

---

## Why This Approach Wins

**Compared to Gifted Chat:**
- 50% less code (no unused features)
- Perfect iOS Messages aesthetic (not "close enough")
- Easy LLM provider switching per persona
- Direct control over every interaction
- No library updates to worry about
- Faster development after initial setup

**Compared to building everything from scratch:**
- We can reference Gifted Chat for patterns
- FlatList handles virtualization for us
- React Native provides solid primitives
- Community has solved common pitfalls

**The sweet spot:**
- Custom UI components
- Proven patterns from open source
- Exact design we want
- Simple data model
- Future-proof architecture

---

## Final Note

Building a custom chat UI may seem daunting, but for Verbalist it's actually **simpler** than wrestling with a library designed for a different use case. Our requirements are focused:
- Display messages in bubbles
- Auto-scroll to bottom
- Show typing indicator
- Handle input with auto-grow
- Display word bag on demand

These are all straightforward React Native patterns. The result will be a chat interface that feels native to iOS, perfectly matches our design, and gives us complete control over the learning experience.