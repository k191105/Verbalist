import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { firestore } from "../services/firebase";
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
import { getSRSStates } from "../services/firestore";
import type { ThemeColors } from "../config/theme";
import { FONT_FAMILIES } from "../config/fonts";

interface DevPanelProps {
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
  userId: string;
  wordListId: string;
}

interface LiveSessionData {
  sessionId: string;
  sessionStatus: string;
  messageCount: number;
  wordBag: Array<{
    word: string;
    targetUseCount: number;
    currentUseCount: number;
    selectionReason?: string;
  }>;
  lastWordUsageScores: Record<string, number>;
  srsStates: Array<{
    word: string;
    bucket: number;
    reviewCount: number;
    correctUses: number;
    confidence: number;
    lastReviewed: string;
  }>;
}

export default function DevPanel({
  visible,
  onClose,
  theme,
  userId,
  wordListId,
}: DevPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LiveSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId || !wordListId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const sessionsRef = collection(firestore, "chatSessions");
        const activeQ = query(
          sessionsRef,
          where("userId", "==", userId),
          where("status", "==", "active"),
          orderBy("startedAt", "desc"),
          limit(1)
        );
        const activeSnap = await getDocs(activeQ);

        if (cancelled) return;

        if (activeSnap.empty) {
          setData(null);
          setLoading(false);
          return;
        }

        const sessionDoc = activeSnap.docs[0];
        const sessionData = sessionDoc.data();
        const wordBag = sessionData.wordBag || [];

        const words = wordBag.map((w: { word: string }) => w.word);
        const srsStates = await getSRSStates(userId, wordListId, words);

        const allMsgQ = query(
          collection(firestore, "messages"),
          where("sessionId", "==", sessionDoc.id),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const allMsgSnap = await getDocs(allMsgQ);
        const lastWordUsageScores: Record<string, number> = {};
        const lastUserMsg = allMsgSnap.docs.find((d) => d.data().role === "user");
        if (lastUserMsg) {
          Object.assign(
            lastWordUsageScores,
            lastUserMsg.data().wordUsageScores || {}
          );
        }

        if (cancelled) return;

        setData({
          sessionId: sessionDoc.id,
          sessionStatus: sessionData.status || "active",
          messageCount: sessionData.messageCount || 0,
          wordBag: wordBag.map((w: any) => ({
            word: w.word,
            targetUseCount: w.targetUseCount ?? 1,
            currentUseCount: w.currentUseCount ?? 0,
            selectionReason: w.selectionReason,
          })),
          lastWordUsageScores,
          srsStates: srsStates.map((s) => ({
            word: s.word,
            bucket: s.bucket,
            reviewCount: s.reviewCount,
            correctUses: s.correctUses,
            confidence: s.confidence,
            lastReviewed: s.lastReviewed?.toDate?.()?.toISOString?.() ?? "",
          })),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible, userId, wordListId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
        <View style={[styles.panel, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Dev Panel</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: theme.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.accent} />
          ) : error ? (
            <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
          ) : !data ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No active session
            </Text>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Section title="Session">
                <Row label="sessionId" value={data.sessionId} mono />
                <Row label="sessionStatus" value={data.sessionStatus} />
                <Row label="messageCount" value={String(data.messageCount)} />
              </Section>

              <Section title="Last Turn Scores">
                {Object.keys(data.lastWordUsageScores).length === 0 ? (
                  <Text style={[styles.muted, { color: theme.textSecondary }]}>
                    (none yet)
                  </Text>
                ) : (
                  Object.entries(data.lastWordUsageScores).map(([word, score]) => (
                    <Row key={word} label={word} value={`${score}/10`} />
                  ))
                )}
              </Section>

              <Section title="Word Bag + SRS">
                {data.wordBag.map((item) => {
                  const srs = data.srsStates.find(
                    (s) => s.word.toLowerCase() === item.word.toLowerCase()
                  );
                  const score = data.lastWordUsageScores[item.word];
                  return (
                    <View
                      key={item.word}
                      style={[styles.wordBlock, { borderColor: theme.border }]}
                    >
                      <View style={styles.wordRow}>
                        <Text style={[styles.wordLabel, { color: theme.text }]}>
                          {item.word}
                        </Text>
                        <View
                          style={[
                            styles.reasonBadge,
                            {
                              backgroundColor:
                                item.selectionReason === "due"
                                  ? "#34C759"
                                  : item.selectionReason === "new"
                                    ? "#007AFF"
                                    : "#8E8E93",
                            },
                          ]}
                        >
                          <Text style={styles.reasonText}>
                            {item.selectionReason ?? "?"}
                          </Text>
                        </View>
                      </View>
                      <Row
                        label="session"
                        value={`${item.currentUseCount}/${item.targetUseCount}`}
                      />
                      {score !== undefined && (
                        <Row label="last score" value={`${score}/10`} />
                      )}
                      {srs && (
                        <>
                          <Row label="bucket" value={String(srs.bucket)} />
                          <Row
                            label="reviewCount"
                            value={String(srs.reviewCount)}
                          />
                          <Row
                            label="correctUses"
                            value={String(srs.correctUses)}
                          />
                          <Row
                            label="confidence"
                            value={srs.confidence.toFixed(2)}
                          />
                          <Row
                            label="lastReviewed"
                            value={
                              srs.lastReviewed
                                ? new Date(srs.lastReviewed).toLocaleString()
                                : "-"
                            }
                            mono
                          />
                        </>
                      )}
                    </View>
                  );
                })}
              </Section>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}:</Text>
      <Text
        style={[styles.rowValue, mono && styles.mono]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.85,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 22,
  },
  closeBtn: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 17,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  empty: {
    padding: 40,
    textAlign: "center",
    fontFamily: FONT_FAMILIES.body,
  },
  error: {
    padding: 20,
    fontFamily: FONT_FAMILIES.body,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#8E8E93",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    gap: 12,
  },
  rowLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    color: "#8E8E93",
    flexShrink: 0,
  },
  rowValue: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    color: "#1C1C1E",
    flex: 1,
    textAlign: "right",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  muted: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    fontStyle: "italic",
  },
  wordBlock: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  wordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  wordLabel: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 16,
  },
  reasonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonText: {
    color: "#FFFFFF",
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 11,
  },
});
