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
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../hooks/useTheme";
import WordBagOverlay from "../../components/WordBagOverlay";

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Chat">;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  wordUsage?: string[];
}

interface WordBagItem {
  word: string;
  confidence: number;
}

// Mock data
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey! Ready to explore some new vocabulary? Technology has become so ubiquitous in our daily lives.",
    timestamp: new Date(Date.now() - 5 * 60000),
    wordUsage: ["ubiquitous"],
  },
  {
    id: "2",
    role: "user",
    content: "Yeah, it really has! Sometimes I feel like I can't escape it.",
    timestamp: new Date(Date.now() - 4 * 60000),
  },
  {
    id: "3",
    role: "assistant",
    content: "That's such a pervasive feeling these days.",
    timestamp: new Date(Date.now() - 3 * 60000),
    wordUsage: ["pervasive"],
  },
  {
    id: "4",
    role: "assistant",
    content: "The constant connectivity can be empowering and overwhelming. Do you think there's value in being more judicious about our tech use?",
    timestamp: new Date(Date.now() - 3 * 60000),
    wordUsage: ["judicious"],
  },
  {
    id: "5",
    role: "user",
    content: "Definitely. I try to be more intentional about when I check my phone now.",
    timestamp: new Date(Date.now() - 2 * 60000),
  },
];

const MOCK_WORD_BAG: WordBagItem[] = [
  { word: "ubiquitous", confidence: 0.8 },
  { word: "pervasive", confidence: 0.6 },
  { word: "judicious", confidence: 0.45 },
  { word: "ephemeral", confidence: 0.2 },
];

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

// Message Bubble Component with long-press support
function MessageBubble({ 
  message, 
  theme,
  onWordLongPress,
}: { 
  message: Message; 
  theme: any;
  onWordLongPress: (word: string) => void;
}) {
  const isUser = message.role === "user";

  const handleLongPress = () => {
    // Extract words from the message (simple word extraction)
    const words = message.content.match(/\b[a-zA-Z]{4,}\b/g) || [];
    if (words.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show action sheet with word options
    Alert.alert(
      "Add Word to List",
      "Select a word to add to your vocabulary list:",
      [
        ...words.slice(0, 5).map((word) => ({
          text: word.toLowerCase(),
          onPress: () => onWordLongPress(word.toLowerCase()),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const renderTextWithHighlights = (text: string, words?: string[]) => {
    if (!words || words.length === 0) {
      return <Text>{text}</Text>;
    }

    const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isTargetWord = words.some((w) => w.toLowerCase() === part.toLowerCase());
      return (
        <Text key={i} style={isTargetWord ? styles.highlightedWord : undefined}>
          {part}
        </Text>
      );
    });
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        styles.bubble, 
        isUser 
          ? [styles.bubbleUser, { backgroundColor: theme.bubbleSent }]
          : [styles.bubbleAssistant, { backgroundColor: theme.bubbleReceived }]
      ]}
    >
      <Text style={[
        styles.bubbleText, 
        isUser 
          ? { color: theme.bubbleSentText }
          : { color: theme.bubbleReceivedText }
      ]}>
        {renderTextWithHighlights(message.content, message.wordUsage)}
      </Text>
    </Pressable>
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
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(36);
  const [showWordBag, setShowWordBag] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleWordLongPress = (word: string) => {
    // TODO: Add to word list in Firestore
    console.log("Adding word to list:", word);
    showSuccessToast(`"${word}" added to your list`);
  };

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setInputHeight(36);
    Keyboard.dismiss();

    // Simulate AI typing and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "That's an interesting thought! The ephemeral nature of our digital interactions is fascinating. Each moment online feels transient, yet leaves a lasting impact on our attention spans.",
        timestamp: new Date(),
        wordUsage: ["ephemeral"],
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 2000);
  }, [inputText]);

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
    // TODO: Open settings sheet
    console.log("Settings pressed");
  };

  const toggleWordBag = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowWordBag(!showWordBag);
  };

  // Group messages by sender and add timestamps
  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    const showDate = !prevMessage || 
      new Date(item.timestamp).toDateString() !== new Date(prevMessage.timestamp).toDateString();
    
    const isLastInGroup = !nextMessage || 
      nextMessage.role !== item.role ||
      new Date(nextMessage.timestamp).getTime() - new Date(item.timestamp).getTime() > 60000;

    return (
      <View>
        {showDate && <DateSeparator date={item.timestamp} theme={theme} />}
        <View style={[styles.messageRow, item.role === "user" && styles.messageRowUser]}>
          <MessageBubble message={item} theme={theme} onWordLongPress={handleWordLongPress} />
        </View>
        {isLastInGroup && <TimeStamp timestamp={item.timestamp} isUser={item.role === "user"} theme={theme} />}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Toast */}
      <Toast visible={showToast} message={toastMessage} theme={theme} />

      {/* Header - extends behind status bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={[styles.backButtonText, { color: theme.accent }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.personaInfo}>
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
          words={MOCK_WORD_BAG}
          visible={showWordBag}
          onClose={() => setShowWordBag(false)}
          theme={theme}
        />

        {/* Input Area */}
        <View style={[
          styles.inputArea, 
          { 
            backgroundColor: theme.surface,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopColor: theme.border,
          }
        ]}>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
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

            <TextInput
              style={[styles.messageInput, { height: inputHeight, color: theme.text }]}
              placeholder="Message"
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onContentSizeChange={handleContentSizeChange}
            />

            <TouchableOpacity
              style={[
                styles.sendButton, 
                { backgroundColor: theme.accent },
                !inputText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  highlightedWord: {
    fontWeight: "600",
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
