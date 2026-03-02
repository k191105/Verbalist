import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../hooks/useTheme";
import { FONT_FAMILIES } from "../../config/fonts";
import { firestore } from "../../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

type PastChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PastChat">;
  route: RouteProp<RootStackParamList, "PastChat">;
};

interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PERSONA_DISPLAY: Record<string, string> = {
  chris: "Chris",
  gemma: "Gemma",
  eva: "Eva",
  sid: "Sid",
};

export default function PastChatScreen({ navigation, route }: PastChatScreenProps) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [personaName, setPersonaName] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [wordBag, setWordBag] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const sessionRef = doc(firestore, "chatSessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = sessionSnap.data();
        setPersonaName(PERSONA_DISPLAY[data.personaId] || data.personaId);
        setWordBag((data.wordBag || []).map((w: any) => w.word));

        const completed = data.completedAt?.toDate();
        if (completed) {
          setSessionDate(completed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
        }

        const msgQ = query(
          collection(firestore, "messages"),
          where("sessionId", "==", sessionId),
          orderBy("timestamp", "asc")
        );
        const msgSnap = await getDocs(msgQ);
        setMessages(
          msgSnap.docs.map((d) => {
            const m = d.data();
            return {
              id: d.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp?.toDate() || new Date(),
            };
          })
        );
      } catch (err) {
        console.warn("Failed to load past chat:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: TranscriptMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: theme.bubbleSent }]
              : [styles.bubbleAssistant, { backgroundColor: theme.bubbleReceived }],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? theme.bubbleSentText : theme.bubbleReceivedText },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.surface, borderBottomColor: "rgba(0,0,0,0.08)" }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={[styles.backBtnText, { color: theme.accent }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerName, { color: theme.text }]}>{personaName}</Text>
            <Text style={[styles.headerDate, { color: theme.textSecondary }]}>{sessionDate}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>
      </View>

      {/* Word summary bar */}
      {wordBag.length > 0 && (
        <View style={[styles.wordBar, { backgroundColor: theme.surface, borderBottomColor: "rgba(0,0,0,0.05)" }]}>
          <Text style={[styles.wordBarLabel, { color: theme.textSecondary }]}>Words: </Text>
          <Text style={[styles.wordBarWords, { color: theme.text }]}>{wordBag.join(", ")}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },

  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 34,
    fontWeight: "300",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 17,
    marginBottom: 2,
  },
  headerDate: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
  },

  wordBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordBarLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
  },
  wordBarWords: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    fontStyle: "italic",
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  messageRow: {
    marginBottom: 4,
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
});
