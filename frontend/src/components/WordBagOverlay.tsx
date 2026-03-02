import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import type { ThemeColors } from "../config/theme";

export interface WordBagDisplayItem {
  word: string;
  confidence: number; // 0–1 or session use ratio
  bucket?: number;   // SRS bucket 0–6
  reviewCount?: number;
  correctUses?: number;
}

interface WordBagOverlayProps {
  words: WordBagDisplayItem[];
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

function getConfidenceColor(
  confidence: number,
  bucket: number | undefined,
  accent: string
): string {
  if (bucket !== undefined && bucket >= 6) return "#E3AF64"; // Gold — mastered
  if (confidence >= 1) return "#34C759"; // Green — fully used this session
  if (confidence >= 0.6) return "#34C759"; // Green — high confidence
  if (confidence >= 0.3) return "#FF9500"; // Orange — medium
  if (confidence > 0) return "#FF6B35";   // Red-orange — low
  return accent; // Default — not yet used
}

function WordItem({
  item,
  theme,
}: {
  item: WordBagDisplayItem;
  theme: ThemeColors;
}) {
  const isUsed = item.confidence >= 1;
  const isMastered = item.bucket !== undefined && item.bucket >= 6;
  const fillColor = getConfidenceColor(item.confidence, item.bucket, theme.accent);
  const displayConfidence =
    item.bucket !== undefined ? item.bucket / 6 : item.confidence;

  return (
    <View style={[styles.wordItem, { backgroundColor: theme.surface }]}>
      <View style={styles.wordLabelRow}>
        <Text
          style={[
            styles.wordText,
            { color: theme.text },
            (isUsed || isMastered) && styles.wordTextUsed,
            isMastered && { color: "#E3AF64" },
          ]}
        >
          {item.word}
        </Text>
        {isUsed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.confidenceContainer}>
        <View style={[styles.confidenceBar, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${Math.min(displayConfidence * 100, 100)}%`,
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function WordBagOverlay({ words, visible, onClose, theme }: WordBagOverlayProps) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Smooth slide up and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Smooth fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.island,
              {
                backgroundColor: theme.cardBackground,
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Arrow pointing down */}
            <View style={[styles.arrow, { backgroundColor: theme.cardBackground }]} />

            {/* Title */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Target Words</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Use these in your messages
              </Text>
            </View>

            {/* Word List */}
            <View style={styles.wordList}>
              {words.map((item, index) => (
                <WordItem key={index} item={item} theme={theme} />
              ))}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  island: {
    position: "absolute",
    bottom: 90,
    left: 12,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    minWidth: 240,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  arrow: {
    position: "absolute",
    bottom: -8,
    left: 28,
    width: 16,
    height: 16,
    transform: [{ rotate: "45deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  wordList: {
    gap: 10,
  },
  wordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  wordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  wordText: {
    fontSize: 16,
    fontWeight: "500",
  },
  wordTextUsed: {
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 14,
    color: "#34C759",
  },
  confidenceContainer: {
    alignItems: "flex-end",
  },
  confidenceBar: {
    width: 50,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
});
