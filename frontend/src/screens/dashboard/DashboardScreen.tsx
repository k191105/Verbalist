import { useEffect, useRef, useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { FONT_FAMILIES } from "../../config/fonts";
import UpgradePrompt from "../../components/UpgradePrompt";
import { firestore } from "../../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";



const PERSONAS = [
  { id: "chris", displayName: "Chris", tagline: "Sharp takes on everyday life" },
  { id: "gemma", displayName: "Gemma", tagline: "Literary, lyrical, steeped in art" },
  { id: "eva", displayName: "Eva", tagline: "Thoughtful and psychologically insightful" },
  { id: "sid", displayName: "Sid", tagline: "Historically grounded and analytical" },
] as const;

const PERSONA_COLORS: Record<string, string> = {
  chris: "#3B5CC6",
  gemma: "#D4983F",
  eva: "#7C4DDB",
  sid: "#1A9A6B",
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Dashboard">;
};

interface PastSession {
  id: string;
  personaId: string;
  completedAt: Date;
  messageCount: number;
  wordBag: { word: string; currentUseCount: number; targetUseCount: number }[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";

  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff < 7) return `${diff}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PersonaAvatar({ personaId, size = 52 }: { personaId: string; size?: number }) {
  const initial = personaId.charAt(0).toUpperCase();
  const color = PERSONA_COLORS[personaId] || PERSONA_COLORS.chris;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wordListName, setWordListName] = useState("");
  const [wordListTotal, setWordListTotal] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activeSessionPreview, setActiveSessionPreview] = useState("");
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Paywall
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradePersonaName, setUpgradePersonaName] = useState<string | undefined>(undefined);

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const wordListRef = doc(firestore, "wordLists", user.activeWordListId);
      const wordListSnap = await getDoc(wordListRef);
      if (wordListSnap.exists()) {
        const data = wordListSnap.data();
        setWordListName(data.name || "");
        setWordListTotal(data.words?.length || 0);
      }

      const sessionsRef = collection(firestore, "chatSessions");

      const activeQ = query(
        sessionsRef,
        where("userId", "==", user.id),
        where("status", "==", "active"),
        orderBy("startedAt", "desc"),
        limit(1)
      );
      const activeSnap = await getDocs(activeQ);
      if (!activeSnap.empty) {
        const data = activeSnap.docs[0].data();
        setHasActiveSession(true);
        setActivePersonaId(data.personaId);

        const msgQ = query(
          collection(firestore, "messages"),
          where("sessionId", "==", activeSnap.docs[0].id),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const msgSnap = await getDocs(msgQ);
        if (!msgSnap.empty) {
          const content = msgSnap.docs[0].data().content || "";
          setActiveSessionPreview(content.length > 55 ? content.substring(0, 55) + "..." : content);
        }
      } else {
        setHasActiveSession(false);
        setActivePersonaId(null);
        setActiveSessionPreview("");
      }

      const pastQ = query(
        sessionsRef,
        where("userId", "==", user.id),
        where("status", "==", "complete"),
        orderBy("completedAt", "desc"),
        limit(20)
      );
      const pastSnap = await getDocs(pastQ);
      setPastSessions(
        pastSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            personaId: data.personaId,
            completedAt: data.completedAt?.toDate() || new Date(),
            messageCount: data.messageCount || 0,
            wordBag: data.wordBag || [],
          };
        })
      );

      setDataLoaded(true);
    } catch (err) {
      console.warn("Dashboard fetch:", err);
      setDataLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);

      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 500, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    })();
  }, [user, fetchData]);

  // Re-fetch when returning from editor
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (dataLoaded) fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData, dataLoaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleStartChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Chat");
  };

  const handlePersonaInfo = (personaId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("PersonaDetail", { personaId });
  };

  const handleLockedPersonaTap = (personaName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpgradePersonaName(personaName);
    setShowUpgrade(true);
  };

  const handleOpenWordListEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WordListEditor");
  };

  const handleViewPastChat = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("PastChat", { sessionId });
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
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 20,
            backgroundColor: theme.cardBackground,
            borderBottomColor: "rgba(0,0,0,0.05)",
            opacity: headerFade,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>{user?.name || "Hey there"}</Text>
            <Text style={[styles.greetingSub, { color: theme.textSecondary }]}>{getGreeting()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: theme.background }]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Settings");
            }}
          >
            <Text style={{ fontSize: 18, color: theme.text }}>⚙</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.wordListCard} activeOpacity={0.75} onPress={handleOpenWordListEditor}>
          <View style={styles.wordListCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wordListLabel}>ACTIVE WORD LIST</Text>
              <Text style={styles.wordListName}>{wordListName || "General"}</Text>
              {wordListTotal > 0 && (
                <Text style={styles.wordListMeta}>{wordListTotal} words</Text>
              )}
            </View>
            <Text style={styles.wordListChevron}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>

          {/* Conversations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Conversations</Text>

            {/* Chris */}
            <View style={[styles.personaRow, { backgroundColor: theme.cardBackground }]}>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.65} onPress={handleStartChat}>
                <PersonaAvatar personaId="chris" size={54} />
                <View style={styles.personaContent}>
                  <View style={styles.personaTopRow}>
                    <Text style={[styles.personaName, { color: theme.text }]}>Chris</Text>
                    {hasActiveSession && activePersonaId === "chris" && (
                      <Text style={[styles.timeLabel, { color: theme.accent }]}>Now</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.personaPreview,
                      { color: theme.textSecondary },
                      hasActiveSession && activePersonaId === "chris" && { color: theme.text, fontWeight: "500" },
                    ]}
                    numberOfLines={1}
                  >
                    {hasActiveSession && activePersonaId === "chris"
                      ? activeSessionPreview || "Resume your conversation"
                      : "Tap to start a conversation"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoBtn} onPress={() => handlePersonaInfo("chris")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.infoBtnText, { color: theme.textSecondary }]}>ⓘ</Text>
              </TouchableOpacity>
            </View>

            {/* Locked personas — greyed out, tap triggers paywall */}
            {PERSONAS.filter((p) => p.id !== "chris").map((persona) => (
              <View
                key={persona.id}
                style={[styles.personaRow, styles.personaRowLocked, { backgroundColor: theme.cardBackground }]}
              >
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                  activeOpacity={0.7}
                  onPress={() => handleLockedPersonaTap(persona.displayName)}
                >
                  <PersonaAvatar personaId={persona.id} size={54} />
                  <View style={styles.personaContent}>
                    <Text style={[styles.personaName, { color: theme.text }]}>{persona.displayName}</Text>
                    <Text style={[styles.personaPreview, { color: theme.textSecondary }]} numberOfLines={1}>
                      {persona.tagline}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.infoBtn} onPress={() => handlePersonaInfo(persona.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={[styles.infoBtnText, { color: theme.textSecondary }]}>ⓘ</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Recent */}
          {pastSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent</Text>
              {pastSessions.map((session, idx) => {
                const persona = PERSONAS.find((p) => p.id === session.personaId);
                const mastered = session.wordBag.filter((w) => w.currentUseCount >= w.targetUseCount).length;
                const total = session.wordBag.length;

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.recentRow,
                      idx < pastSessions.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: "rgba(0,0,0,0.06)",
                      },
                    ]}
                    activeOpacity={0.65}
                    onPress={() => handleViewPastChat(session.id)}
                  >
                    <PersonaAvatar personaId={session.personaId} size={42} />
                    <View style={styles.recentContent}>
                      <View style={styles.recentTopRow}>
                        <Text style={[styles.recentName, { color: theme.text }]}>
                          {persona?.displayName || session.personaId}
                        </Text>
                        <Text style={[styles.recentDate, { color: theme.textSecondary }]}>
                          {getRelativeDate(session.completedAt)}
                        </Text>
                      </View>
                      <Text style={[styles.recentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                        {total > 0 ? `${mastered} of ${total} words mastered` : `${session.messageCount} messages`}
                      </Text>
                    </View>
                    <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Empty state — shown when data loaded and nothing to show */}
          {dataLoaded && pastSessions.length === 0 && !hasActiveSession && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Your conversations will appear here</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Tap Chris above to start your first conversation and begin learning words naturally.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Paywall */}
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={() => setShowUpgrade(false)}
        theme={theme}
        personaName={upgradePersonaName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  greetingSub: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  wordListCard: {
    backgroundColor: "#26428B",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  wordListCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordListLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
  },
  wordListName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  wordListMeta: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  wordListChevron: {
    fontFamily: FONT_FAMILIES.bodyLight,
    fontSize: 28,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 8,
  },

  scroll: { flex: 1 },
  section: {
    paddingTop: 28,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 22,
    marginBottom: 16,
    paddingLeft: 4,
  },

  personaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  personaRowLocked: { opacity: 0.5 },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontFamily: FONT_FAMILIES.display,
    color: "#FFFFFF",
  },
  personaContent: {
    flex: 1,
    minWidth: 0,
  },
  personaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 5,
  },
  personaName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 18,
  },
  timeLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
  },
  personaPreview: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    lineHeight: 20,
  },
  infoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  infoBtnText: {
    fontSize: 18,
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  recentContent: { flex: 1, minWidth: 0 },
  recentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 3,
  },
  recentName: { fontFamily: FONT_FAMILIES.display, fontSize: 16 },
  recentDate: { fontFamily: FONT_FAMILIES.body, fontSize: 13 },
  recentMeta: { fontFamily: FONT_FAMILIES.body, fontSize: 14 },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
    marginLeft: 8,
  },

  emptyState: { paddingHorizontal: 40, paddingTop: 56, alignItems: "center" },
  emptyTitle: { fontFamily: FONT_FAMILIES.display, fontSize: 20, textAlign: "center", marginBottom: 10 },
  emptySub: { fontFamily: FONT_FAMILIES.body, fontSize: 15, textAlign: "center", lineHeight: 23 },
});
