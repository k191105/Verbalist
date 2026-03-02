import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { ThemeColors } from "../config/theme";
import { FONT_FAMILIES } from "../config/fonts";

interface WordDefinitionIslandProps {
  word: string;
  visible: boolean;
  onClose: () => void;
  onAddWord: (word: string) => void;
  theme: ThemeColors;
}

interface WordData {
  definition: string;
  partOfSpeech: string;
  synonyms: string[];
}

const WORD_DATABASE: Record<string, WordData> = {};

function lookupWord(word: string): WordData {
  const lower = word.toLowerCase();
  if (WORD_DATABASE[lower]) return WORD_DATABASE[lower];

  return {
    definition: "Tap to add this word to your vocabulary list for future conversations.",
    partOfSpeech: "",
    synonyms: [],
  };
}

function SynonymChip({
  word,
  theme,
  onPress,
}: {
  word: string;
  theme: ThemeColors;
  onPress: (word: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { borderColor: theme.border }]}
      onPress={() => onPress(word)}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: theme.text }]}>{word}</Text>
      <Text style={[styles.chipAdd, { color: theme.accent }]}>+</Text>
    </TouchableOpacity>
  );
}

export default function WordDefinitionIsland({
  word,
  visible,
  onClose,
  onAddWord,
  theme,
}: WordDefinitionIslandProps) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && word) {
      setIsLoading(true);
      const data = lookupWord(word);
      setWordData(data);
      setIsLoading(false);

      // Fetch from free dictionary API
      fetchDefinition(word).then((fetched) => {
        if (fetched) setWordData(fetched);
        setIsLoading(false);
      });

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 280,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, word]);

  if (!visible) return null;

  const handleAddWord = (w: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddWord(w);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.scrim, { opacity: scrimOpacity }]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.island,
          {
            backgroundColor: theme.cardBackground,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Subtle top notch like Kindle */}
        <View style={[styles.notch, { backgroundColor: theme.textSecondary, opacity: 0.12 }]} />

        {/* Word title */}
        <View style={styles.wordHeader}>
          <Text style={[styles.wordTitle, { color: theme.text }]}>
            {word}
          </Text>
          {wordData?.partOfSpeech ? (
            <Text style={[styles.partOfSpeech, { color: theme.textSecondary }]}>
              {wordData.partOfSpeech}
            </Text>
          ) : null}
        </View>

        {/* Definition */}
        <Text style={[styles.definition, { color: theme.text }]}>
          {isLoading ? "Looking up..." : wordData?.definition || ""}
        </Text>

        {/* Synonyms */}
        {wordData && wordData.synonyms.length > 0 && (
          <View style={styles.synonymsSection}>
            <Text style={[styles.synonymsLabel, { color: theme.textSecondary }]}>
              Similar words
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {wordData.synonyms.slice(0, 6).map((syn) => (
                <SynonymChip
                  key={syn}
                  word={syn}
                  theme={theme}
                  onPress={handleAddWord}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border, opacity: 0.3 }]} />

        {/* Add to list button */}
        <TouchableOpacity
          style={[styles.addButton, { borderColor: theme.accent }]}
          onPress={() => handleAddWord(word)}
          activeOpacity={0.7}
        >
          <Text style={[styles.addButtonText, { color: theme.accent }]}>
            Add to my word list
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

async function fetchDefinition(word: string): Promise<WordData | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const entry = json[0];
    const meaning = entry.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition || "";
    const pos = meaning?.partOfSpeech || "";
    const syns: string[] = [];

    for (const m of entry.meanings || []) {
      for (const s of m.synonyms || []) {
        if (syns.length < 8 && !syns.includes(s)) syns.push(s);
      }
      for (const d of m.definitions || []) {
        for (const s of d.synonyms || []) {
          if (syns.length < 8 && !syns.includes(s)) syns.push(s);
        }
      }
    }

    return { definition: def, partOfSpeech: pos, synonyms: syns };
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 25, 57, 0.08)",
    zIndex: 99,
  },
  island: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 20,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 16,
    zIndex: 100,
  },
  notch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 10,
  },
  wordTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  partOfSpeech: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    fontStyle: "italic",
  },
  definition: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  synonymsSection: {
    marginBottom: 16,
  },
  synonymsLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
  chipAdd: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  addButtonText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 15,
  },
});
