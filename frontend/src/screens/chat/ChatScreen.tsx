import { useEffect, useRef, useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import WordBagOverlay from "../../components/WordBagOverlay";
import WordDefinitionIsland from "../../components/WordDefinitionIsland";
import { startChatSession, sendUserMessage } from "../../services/chat";

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Chat">;
};

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
  wordUsage?: string[];
  /** Target words for the session — used for highlighting */
  targetWords?: string[];
  /** For error messages: the user message text to retry */
  retryMessage?: string;
  /** For error messages: the Firestore message ID to avoid duplicates */
  retryMessageId?: string;
}

interface WordBagItem {
  word: string;
  confidence: number;
}

interface BackendWordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

/** Convert backend word bag to display format */
function toDisplayWordBag(items: BackendWordBagItem[]): WordBagItem[] {
  return items.map((item) => ({
    word: item.word,
    confidence: item.targetUseCount > 0
      ? item.currentUseCount / item.targetUseCount
      : 0,
  }));
}

// Toast component for success message
function Toast({ visible, message, theme }: { visible: boolean; message: string; theme: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { backgroundColor: theme.accent, opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.toastText, { color: theme.buttonText }]}>{message}</Text>
    </Animated.View>
  );
}

// Typing Indicator Component
function TypingIndicator({ theme }: { theme: any }) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
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
    <View style={[styles.typingContainer, { backgroundColor: theme.bubbleReceived }]}>
      <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary, transform: [{ translateY: dot1Anim }] }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary, transform: [{ translateY: dot2Anim }] }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary, transform: [{ translateY: dot3Anim }] }]} />
    </View>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  theme,
  onWordTap,
  onWordLongPress,
}: { 
  message: Message; 
  theme: any;
  onWordTap: (word: string) => void;
  onWordLongPress: (word: string) => void;
}) {
  const isUser = message.role === "user";
  const textColor = isUser ? theme.bubbleSentText : theme.bubbleReceivedText;

  const handleLongPress = () => {
    const words = message.content.match(/\b[a-zA-Z]{4,}\b/g) || [];
    if (words.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const firstInteresting = words.find((w) => w.length >= 5) ?? words[0];
    if (!firstInteresting) return;
    onWordLongPress(firstInteresting.toLowerCase());
  };

  const highlightWords = isUser ? message.wordUsage : message.targetWords;

  const renderTextWithHighlights = (text: string, words?: string[]) => {
    if (!words || words.length === 0) {
      return <Text>{text}</Text>;
    }

    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escaped.join("|")})\\w*\\b`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isTargetWord = words.some(
        (w) => part.toLowerCase().startsWith(w.toLowerCase())
      );
      if (!isTargetWord) return <Text key={i}>{part}</Text>;

      return (
        <Text
          key={i}
          style={[styles.targetWord, { color: textColor }]}
          onPress={() => onWordTap(part.toLowerCase().replace(/[^a-z]/g, ""))}
        >
          {part}
        </Text>
      );
    });
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[
        styles.bubble, 
        isUser 
          ? [styles.bubbleUser, { backgroundColor: theme.bubbleSent }]
          : [styles.bubbleAssistant, { backgroundColor: theme.bubbleReceived }]
      ]}
    >
      <Text style={[
        styles.bubbleText, 
        { color: textColor }
      ]}>
        {renderTextWithHighlights(message.content, highlightWords)}
      </Text>
    </Pressable>
  );
}

// Session Completion Card Component
function SessionCompleteCard({ 
  wordBag, 
  suggestedWords,
  theme, 
  onClose,
  onAddSuggestedWord, 
}: { 
  wordBag: WordBagItem[]; 
  suggestedWords: string[];
  theme: any; 
  onClose: () => void;
  onAddSuggestedWord: (word: string) => void;
}) {
  const masteredWords = wordBag.filter((w) => w.confidence >= 1);
  const totalWords = wordBag.length;
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  const handleAddWord = (word: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddedWords((prev) => new Set(prev).add(word));
    onAddSuggestedWord(word);
  };

  return (
    <>
      <View style={styles.scrim} />
      
      <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
        <View style={[styles.pullHandle, { backgroundColor: theme.textSecondary, opacity: 0.15 }]} />
        
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Session Complete</Text>

          <View style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.08 }]} />

          <View style={styles.completionSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Words discussed</Text>
            <Text style={[styles.sectionContent, { color: theme.text }]}>
              {wordBag.map((w) => w.word).join(", ")}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.08 }]} />

          <View style={styles.completionSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Your progress</Text>
            <Text style={[styles.sectionContentProgress, { color: theme.text }]}>
              {masteredWords.length} of {totalWords} words used naturally
            </Text>
            {masteredWords.length === totalWords && totalWords > 0 && (
              <Text style={[styles.bonusMessage, { color: theme.accent }]}>
                You've earned an additional conversation for today.
              </Text>
            )}
          </View>

          {/* Suggested words to add */}
          {suggestedWords.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.08 }]} />
              <View style={styles.completionSection}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Add to your list</Text>
                <View style={styles.suggestedWordsRow}>
                  {suggestedWords.map((word) => {
                    const isAdded = addedWords.has(word);
                    return (
                      <TouchableOpacity
                        key={word}
                        style={[
                          styles.suggestedChip,
                          { borderColor: isAdded ? theme.accent : theme.border },
                          isAdded && { backgroundColor: "rgba(227,175,100,0.08)" },
                        ]}
                        onPress={() => !isAdded && handleAddWord(word)}
                        activeOpacity={isAdded ? 1 : 0.65}
                      >
                        <Text style={[
                          styles.suggestedChipText,
                          { color: isAdded ? theme.accent : theme.text },
                        ]}>
                          {isAdded ? `✓ ${word}` : `+ ${word}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.08 }]} />

          <TouchableOpacity
            style={[styles.returnButton, { backgroundColor: theme.cardBackground, borderColor: theme.textSecondary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.returnButtonText, { color: theme.text }]}>Return to conversations</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// Error / Retry Bubble Component
function ErrorBubble({ message, theme, onRetry }: { message: Message; theme: any; onRetry: (msg: Message) => void }) {
  return (
    <TouchableOpacity
      style={[styles.errorBubble, { backgroundColor: theme.bubbleReceived }]}
      onPress={() => onRetry(message)}
      activeOpacity={0.7}
    >
      <Text style={[styles.errorBubbleText, { color: theme.textSecondary }]}>
        Couldn't get a response. Tap to retry.
      </Text>
    </TouchableOpacity>
  );
}

// Date Separator Component
function DateSeparator({ date, theme }: { date: Date; theme: any }) {
  const formatDate = (d: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (messageDate.getTime() === today.getTime()) return "Today";
    if (messageDate.getTime() === yesterday.getTime()) return "Yesterday";

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.dateSeparator}>
      <Text style={[styles.dateText, { color: theme.textSecondary }]}>{formatDate(date)}</Text>
    </View>
  );
}

// Time Stamp Component
function TimeStamp({ timestamp, isUser, theme }: { timestamp: Date; isUser: boolean; theme: any }) {
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Text style={[styles.timestamp, { color: theme.textSecondary }, isUser && styles.timestampRight]}>
      {formatTime(timestamp)}
    </Text>
  );
}

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [wordBag, setWordBag] = useState<WordBagItem[]>([]);
  const [backendWordBag, setBackendWordBag] = useState<BackendWordBagItem[]>([]);
  const [sessionStatus, setSessionStatus] = useState<"active" | "complete" | "error">("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(36);
  const [showWordBag, setShowWordBag] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");
  const [showWordIsland, setShowWordIsland] = useState(false);
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Initialize chat session on mount
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function initSession() {
      try {
        setLoading(true);
        setError(null);

        // First, check if there's an active session to resume
        const { checkActiveSession } = await import("../../services/chat");
        const activeSession = await checkActiveSession(user!.id);

        if (cancelled) return;

        if (activeSession) {
          // Resume existing session
          setSessionId(activeSession.sessionId);
          setBackendWordBag(activeSession.wordBag);
          setWordBag(toDisplayWordBag(activeSession.wordBag));

          const targetWords = activeSession.wordBag.map((w: any) => w.word);
          const restoredMessages: Message[] = activeSession.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            targetWords: msg.role === "assistant" ? targetWords : undefined,
          }));
          setMessages(restoredMessages);
        } else {
          // Create new session
          const result = await startChatSession("chris", user!.activeWordListId);

          if (cancelled) return;

          setSessionId(result.sessionId);
          setBackendWordBag(result.wordBag);
          setWordBag(toDisplayWordBag(result.wordBag));

          // Display the first message from the AI
          const targetWords = result.wordBag.map((w) => w.word);
          const firstMsg: Message = {
            id: "first-" + Date.now(),
            role: "assistant",
            content: result.firstMessage,
            timestamp: new Date(),
            targetWords,
          };
          setMessages([firstMsg]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to create session:", err);
        const errorMsg = err instanceof Error && err.message === "Daily limit reached"
          ? "You've used all your chats for today. Master all your target words to earn bonus chats!"
          : "Couldn't start the conversation. Tap to retry.";
        setError(errorMsg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, [user]);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleWordTap = useCallback((word: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWord(word);
    setShowWordIsland(true);
  }, []);

  const handleWordLongPress = useCallback((word: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedWord(word);
    setShowWordIsland(true);
  }, []);

  const handleAddWordFromIsland = useCallback((word: string) => {
    setShowWordIsland(false);
    showSuccessToast(`"${word}" added to your list`);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !sessionId || isSending || sessionStatus === "complete") return;

    const text = inputText.trim();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI: add user message immediately
    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setInputHeight(36);
    Keyboard.dismiss();

    // Show typing indicator while waiting for AI
    setIsTyping(true);
    setIsSending(true);

    try {
      const result = await sendUserMessage(sessionId, text);

      // If the AI failed, show inline retry button instead of AI response
      if (result.sessionStatus === "error") {
        const errorMsg: Message = {
          id: "error-" + Date.now(),
          role: "error",
          content: "Couldn't get a response. Tap to retry.",
          timestamp: new Date(),
          retryMessage: text,
          retryMessageId: result.userMessageId,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        // Get target words for highlighting in AI bubbles
        const targetWords = result.updatedWordBag.map((w) => w.word);

        // Use split messages if available, otherwise fall back to single message
        const messageParts = result.aiMessages && result.aiMessages.length > 0
          ? result.aiMessages
          : [result.aiMessage];

        // Add messages with typing delay (stagger if multiple parts)
        if (messageParts.length === 1) {
          // Single message: add immediately
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            role: "assistant" as const,
            content: messageParts[0],
            timestamp: new Date(),
            targetWords,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          // Multiple messages: stagger with typing delays
          // Typing speed: ~20 chars/second, minimum 800ms, maximum 3000ms
          const calculateDelay = (text: string) => {
            const baseDelay = Math.max(800, Math.min(3000, text.length * 50));
            return baseDelay;
          };

          let cumulativeDelay = 0;
          messageParts.forEach((part, i) => {
            const delay = i === 0 ? 0 : cumulativeDelay;
            setTimeout(() => {
              const aiMsg: Message = {
                id: `ai-${Date.now()}-${i}`,
                role: "assistant" as const,
                content: part,
                timestamp: new Date(),
                targetWords,
              };
              setMessages((prev) => [...prev, aiMsg]);
            }, delay);
            cumulativeDelay += calculateDelay(part);
          });
        }

        setBackendWordBag(result.updatedWordBag);
        setWordBag(toDisplayWordBag(result.updatedWordBag));
        setSessionStatus(result.sessionStatus);

        if (result.suggestedWords?.length) {
          setSuggestedWords(result.suggestedWords);
        }

        if (result.bonusChatEarned) {
          showSuccessToast("You earned a bonus chat!");
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg: Message = {
        id: "error-" + Date.now(),
        role: "error",
        content: "Couldn't get a response. Tap to retry.",
        timestamp: new Date(),
        retryMessage: text,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  }, [inputText, sessionId, isSending, sessionStatus]);

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(36, event.nativeEvent.contentSize.height), 120);
    setInputHeight(newHeight);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Dashboard");
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("Settings pressed");
  };

  const toggleWordBag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowWordBag(!showWordBag);
  };

  const handleRetryMessage = useCallback(async (errorMsg: Message) => {
    if (!sessionId || isSending || !errorMsg.retryMessage) return;

    // Remove the error bubble
    setMessages((prev) => prev.filter((m) => m.id !== errorMsg.id));

    setIsTyping(true);
    setIsSending(true);

    try {
      const result = await sendUserMessage(
        sessionId,
        errorMsg.retryMessage,
        errorMsg.retryMessageId // pass so backend skips duplicate user message
      );

      if (result.sessionStatus === "error") {
        const newError: Message = {
          id: "error-" + Date.now(),
          role: "error",
          content: "Couldn't get a response. Tap to retry.",
          timestamp: new Date(),
          retryMessage: errorMsg.retryMessage,
          retryMessageId: result.userMessageId || errorMsg.retryMessageId,
        };
        setMessages((prev) => [...prev, newError]);
      } else {
        const targetWords = result.updatedWordBag.map((w) => w.word);
        const messageParts = result.aiMessages && result.aiMessages.length > 0
          ? result.aiMessages
          : [result.aiMessage];

        // Add messages with typing delay
        if (messageParts.length === 1) {
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            role: "assistant" as const,
            content: messageParts[0],
            timestamp: new Date(),
            targetWords,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          const calculateDelay = (text: string) => {
            return Math.max(800, Math.min(3000, text.length * 50));
          };

          let cumulativeDelay = 0;
          messageParts.forEach((part, i) => {
            const delay = i === 0 ? 0 : cumulativeDelay;
            setTimeout(() => {
              const aiMsg: Message = {
                id: `ai-${Date.now()}-${i}`,
                role: "assistant" as const,
                content: part,
                timestamp: new Date(),
                targetWords,
              };
              setMessages((prev) => [...prev, aiMsg]);
            }, delay);
            cumulativeDelay += calculateDelay(part);
          });
        }

        setBackendWordBag(result.updatedWordBag);
        setWordBag(toDisplayWordBag(result.updatedWordBag));
        setSessionStatus(result.sessionStatus);

        if (result.suggestedWords?.length) {
          setSuggestedWords(result.suggestedWords);
        }

        if (result.bonusChatEarned) {
          showSuccessToast("You earned a bonus chat!");
        }
      }
    } catch (err) {
      console.error("Retry failed:", err);
      const newError: Message = {
        id: "error-" + Date.now(),
        role: "error",
        content: "Couldn't get a response. Tap to retry.",
        timestamp: new Date(),
        retryMessage: errorMsg.retryMessage,
        retryMessageId: errorMsg.retryMessageId,
      };
      setMessages((prev) => [...prev, newError]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  }, [sessionId, isSending]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (!user) return;
    startChatSession("chris", user.activeWordListId)
      .then((result) => {
        setSessionId(result.sessionId);
        setBackendWordBag(result.wordBag);
        setWordBag(toDisplayWordBag(result.wordBag));
        const targetWords = result.wordBag.map((w) => w.word);
        const firstMsg: Message = {
          id: "first-" + Date.now(),
          role: "assistant",
          content: result.firstMessage,
          timestamp: new Date(),
          targetWords,
        };
        setMessages([firstMsg]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Retry failed:", err);
        setError("Couldn't start the conversation. Tap to retry.");
        setLoading(false);
      });
  };

  // Render message items
  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    const showDate = !prevMessage || 
      new Date(item.timestamp).toDateString() !== new Date(prevMessage.timestamp).toDateString();
    
    const isLastInGroup = !nextMessage || 
      nextMessage.role !== item.role ||
      new Date(nextMessage.timestamp).getTime() - new Date(item.timestamp).getTime() > 60000;

    // Render error/retry bubble
    if (item.role === "error") {
      return (
        <View style={styles.messageRow}>
          <ErrorBubble message={item} theme={theme} onRetry={handleRetryMessage} />
        </View>
      );
    }

    return (
      <View>
        {showDate && <DateSeparator date={item.timestamp} theme={theme} />}
        <View style={[styles.messageRow, item.role === "user" && styles.messageRowUser]}>
          <MessageBubble message={item} theme={theme} onWordTap={handleWordTap} onWordLongPress={handleWordLongPress} />
        </View>
        {isLastInGroup && <TimeStamp timestamp={item.timestamp} isUser={item.role === "user"} theme={theme} />}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Starting conversation...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity onPress={handleRetry}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Toast */}
      <Toast visible={showToast} message={toastMessage} theme={theme} />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={[styles.backButtonText, { color: theme.accent }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.personaInfo}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("PersonaDetail", { personaId: "chris" });
            }}
          >
            <Text style={[styles.personaName, { color: theme.text }]}>Chris</Text>
            <Text style={[styles.personaSubtitle, { color: theme.textSecondary }]}>
              {isTyping ? "typing..." : "online"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreButton} onPress={handleSettings}>
            <Text style={[styles.moreButtonText, { color: theme.accent }]}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isTyping ? (
            <View style={styles.messageRow}>
              <TypingIndicator theme={theme} />
            </View>
          ) : null}
        />

        {/* Word Bag Overlay */}
        <WordBagOverlay
          words={wordBag}
          visible={showWordBag}
          onClose={() => setShowWordBag(false)}
          theme={theme}
        />

        {/* Word Definition Island */}
        <WordDefinitionIsland
          word={selectedWord}
          visible={showWordIsland}
          onClose={() => setShowWordIsland(false)}
          onAddWord={handleAddWordFromIsland}
          theme={theme}
        />

        {/* Session complete overlay */}
        {sessionStatus === "complete" && (
          <SessionCompleteCard
            wordBag={wordBag}
            suggestedWords={suggestedWords}
            theme={theme}
            onClose={handleBack}
            onAddSuggestedWord={(word) => {
              showSuccessToast(`"${word}" added to your list`);
            }}
          />
        )}

        {/* Input Area */}
        {sessionStatus !== "complete" && (
          <View style={[
            styles.inputArea, 
            { 
              backgroundColor: theme.surface,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopColor: theme.border,
            }
          ]}>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              {/* Only show word bag button if there are target words */}
              {wordBag.length > 0 && (
                <TouchableOpacity
                  style={styles.wordBagButton}
                  onPress={toggleWordBag}
                >
                  <View style={styles.wordBagIcon}>
                    <View style={[styles.iconLine, { backgroundColor: theme.accent }]} />
                    <View style={[styles.iconLine, { backgroundColor: theme.accent }]} />
                    <View style={[styles.iconLine, { backgroundColor: theme.accent }]} />
                  </View>
                </TouchableOpacity>
              )}

              <TextInput
                style={[styles.messageInput, { height: inputHeight, color: theme.text }]}
                placeholder="Message"
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                onContentSizeChange={handleContentSizeChange}
                editable={!isSending}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { backgroundColor: theme.accent },
                  (!inputText.trim() || isSending) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                <Text style={styles.sendButtonText}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 25, 57, 0.15)",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  pullHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetContent: {
    paddingHorizontal: 32,
  },
  sheetTitle: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 24,
    letterSpacing: -0.3,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  completionSection: {
    marginBottom: 0,
  },
  suggestedWordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  suggestedChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestedChipText: {
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: "italic",
  },
  sectionContentProgress: {
    fontSize: 17,
    lineHeight: 26,
  },
  bonusMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  returnButton: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    marginTop: 8,
  },
  returnButtonText: {
    fontFamily: "CrimsonPro_600SemiBold",
    fontSize: 17,
  },
  toast: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 1000,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontSize: 15,
    fontWeight: "500",
  },
  headerContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 34,
    fontWeight: "300",
  },
  personaInfo: {
    flex: 1,
    alignItems: "center",
  },
  personaName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  personaSubtitle: {
    fontSize: 12,
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  moreButtonText: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    marginBottom: 2,
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  targetWord: {
    fontWeight: "600",
  },
  errorBubble: {
    alignSelf: "flex-start",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "75%",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    borderStyle: "dashed",
  },
  errorBubbleText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 13,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  timestampRight: {
    textAlign: "right",
  },
  typingContainer: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputArea: {
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  wordBagButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  wordBagIcon: {
    gap: 4,
  },
  iconLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  messageInput: {
    flex: 1,
    fontSize: 17,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 120,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
