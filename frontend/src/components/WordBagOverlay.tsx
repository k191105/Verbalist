import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import type { ThemeColors } from "../config/theme";

interface WordBagItem {
  word: string;
  confidence: number;
}

interface WordBagOverlayProps {
  words: WordBagItem[];
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

function WordItem({ item, theme }: { item: WordBagItem; theme: ThemeColors }) {
  return (
    <View style={[styles.wordItem, { backgroundColor: theme.surface }]}>
      <Text style={[styles.wordText, { color: theme.text }]}>{item.word}</Text>
      <View style={styles.confidenceContainer}>
        <View style={[styles.confidenceBar, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${item.confidence * 100}%`,
                backgroundColor: theme.accent,
              }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
          {Math.round(item.confidence * 100)}%
        </Text>
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
  wordText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  confidenceText: {
    fontSize: 12,
    fontWeight: "500",
    width: 32,
    textAlign: "right",
  },
});
