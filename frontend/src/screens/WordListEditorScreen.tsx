import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { FONT_FAMILIES } from "../config/fonts";
import { firestore } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  updateActiveWordList,
  updateWordList,
} from "../services/firestore";
import { parseAndValidateWords } from "../utils/wordValidator";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "WordListEditor">;
};

interface WordListOption {
  id: string;
  name: string;
  wordCount: number;
  isTemplate: boolean;
  words: string[];
  description?: string;
}

// Placeholder for SRS confidence data (Phase 10)
// For now, we'll show random confidence for demo purposes
// Later this will come from SRSState in Firestore
interface WordWithConfidence {
  word: string;
  confidence: number; // 0-4 dots (0 = new, 4 = mastered)
  isMastered: boolean; // All 4 dots filled
}

const CARD_DESCRIPTIONS: Record<string, string> = {
  "General High-Level Vocabulary": "Sophisticated vocabulary for everyday eloquence",
  "Literary and Rhetorical": "The language of literature, criticism, and persuasion",
  "Politics and Public Life": "Navigate discourse on governance and civic engagement",
};

type SortMode = "mastery-asc" | "mastery-desc" | "alphabetical";

export default function WordListEditorScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [tab, setTab] = useState<"active" | "presets">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active list data
  const [activeList, setActiveList] = useState<WordListOption | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("mastery-asc");

  // Presets
  const [presets, setPresets] = useState<WordListOption[]>([]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(contentFade, { toValue: 1, duration: 500, delay: 120, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch active word list
      const wlRef = doc(firestore, "wordLists", user.activeWordListId);
      const wlSnap = await getDoc(wlRef);
      if (wlSnap.exists()) {
        const data = wlSnap.data();
        const list: WordListOption = {
          id: wlSnap.id,
          name: data.name,
          wordCount: data.words?.length || 0,
          isTemplate: data.isTemplate || false,
          words: data.words || [],
          description: data.description,
        };
        setActiveList(list);
        setWords(list.words);
      }

      // Fetch all presets
      const ref = collection(firestore, "wordLists");
      const templateQ = query(ref, where("isTemplate", "==", true));
      const templateSnap = await getDocs(templateQ);
      setPresets(
        templateSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            wordCount: data.words?.length || 0,
            isTemplate: true,
            words: data.words || [],
            description: data.description,
          };
        })
      );
    } catch (err) {
      console.warn("Failed to fetch word list:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleDone = async () => {
    if (!user || !activeList) {
      handleBack();
      return;
    }

    // If words changed, save them
    const originalWords = activeList.words;
    const hasChanges = JSON.stringify(words.sort()) !== JSON.stringify(originalWords.sort());
    
    if (hasChanges) {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await updateWordList(activeList.id, { words });
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    }
    
    handleBack();
  };

  const handleRemoveWord = (word: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWords((prev) => prev.filter((w) => w !== word));
  };

  const handleAddWords = useCallback(() => {
    if (!searchQuery.trim()) return;
    const { valid } = parseAndValidateWords(searchQuery);
    if (valid.length > 0) {
      setWords((prev) => {
        const existingSet = new Set(prev);
        const newWords = valid.filter((w) => !existingSet.has(w));
        if (newWords.length > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return [...prev, ...newWords];
      });
      setSearchQuery("");
    }
  }, [searchQuery]);

  const handleSwitchToPreset = async (preset: WordListOption) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (preset.id === activeList?.id) return;

    Alert.alert(
      "Switch Word List",
      `Switch to "${preset.name}"? New sessions will use this list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            setSaving(true);
            try {
              await updateActiveWordList(user.id, preset.id);
              setActiveList(preset);
              setWords(preset.words);
              setTab("active");
            } catch (err) {
              console.error("Failed to switch:", err);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // Generate mock confidence data (Phase 10 will replace this with real SRS data)
  const getWordsWithConfidence = (): WordWithConfidence[] => {
    return words.map((word) => {
      // Mock: Random confidence for now
      // TODO Phase 10: Fetch from SRSState collection
      const confidence = Math.floor(Math.random() * 5); // 0-4
      return {
        word,
        confidence,
        isMastered: confidence === 4,
      };
    });
  };

  // Filter and sort words
  const getFilteredAndSortedWords = (): WordWithConfidence[] => {
    let wordsWithConf = getWordsWithConfidence();

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      wordsWithConf = wordsWithConf.filter((w) => w.word.toLowerCase().includes(query));
    }

    // Sort
    switch (sortMode) {
      case "mastery-asc":
        // Low to high: lowest confidence first
        wordsWithConf.sort((a, b) => a.confidence - b.confidence);
        break;
      case "mastery-desc":
        // High to low: highest confidence first
        wordsWithConf.sort((a, b) => b.confidence - a.confidence);
        break;
      case "alphabetical":
        wordsWithConf.sort((a, b) => a.word.localeCompare(b.word));
        break;
    }

    return wordsWithConf;
  };

  const displayWords = getFilteredAndSortedWords();

  // Count mastered words
  const masteredCount = words.filter((word) => {
    // Mock: ~25% are mastered for demo
    // TODO Phase 10: Count from real SRS data
    return Math.random() > 0.75;
  }).length;

  // Determine list name
  const listDisplayName = activeList?.isTemplate ? activeList.name : "Your word list";

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.divider,
            opacity: headerFade,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backText, { color: theme.accentSecondary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Word Lists</Text>
          <TouchableOpacity onPress={handleDone} disabled={saving}>
            <Text style={[styles.doneText, { color: theme.accentSecondary }]}>
              {saving ? "Saving..." : "Done"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setTab("active")}>
            <Text
              style={[
                styles.tab,
                { color: theme.textSecondary },
                tab === "active" && [styles.tabActive, { color: theme.text, borderBottomColor: theme.text }],
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab("presets")}>
            <Text
              style={[
                styles.tab,
                { color: theme.textSecondary },
                tab === "presets" && [styles.tabActive, { color: theme.text, borderBottomColor: theme.text }],
              ]}
            >
              Presets
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: contentFade }}>
        {tab === "active" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* List header */}
            <View style={styles.listHeader}>
              <Text style={[styles.listName, { color: theme.text }]}>{listDisplayName}</Text>
              <Text style={[styles.listMeta, { color: theme.textSecondary }]}>
                {words.length} words • {masteredCount} mastered
              </Text>
            </View>

            {/* Search/Add Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.cardBackground,
                  },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search or add words..."
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleAddWords}
              />
              <Text style={[styles.searchHint, { color: theme.textSecondary }]}>
                Type to search, press return to add
              </Text>
            </View>

            {/* Sort Controls */}
            <View style={styles.sortControls}>
              <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>SORT BY</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setSortMode("mastery-asc");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.sortButton,
                    { borderColor: theme.border, backgroundColor: theme.cardBackground },
                    sortMode === "mastery-asc" && {
                      backgroundColor: theme.accentSecondary,
                      borderColor: theme.accentSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: theme.accentSecondary },
                      sortMode === "mastery-asc" && { color: "#FFFFFF" },
                    ]}
                  >
                    Mastery ↑
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSortMode("mastery-desc");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.sortButton,
                    { borderColor: theme.border, backgroundColor: theme.cardBackground },
                    sortMode === "mastery-desc" && {
                      backgroundColor: theme.accentSecondary,
                      borderColor: theme.accentSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: theme.accentSecondary },
                      sortMode === "mastery-desc" && { color: "#FFFFFF" },
                    ]}
                  >
                    Mastery ↓
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSortMode("alphabetical");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.sortButton,
                    { borderColor: theme.border, backgroundColor: theme.cardBackground },
                    sortMode === "alphabetical" && {
                      backgroundColor: theme.accentSecondary,
                      borderColor: theme.accentSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: theme.accentSecondary },
                      sortMode === "alphabetical" && { color: "#FFFFFF" },
                    ]}
                  >
                    A–Z
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Word List */}
            <View style={[styles.wordList, { backgroundColor: theme.cardBackground }]}>
              {displayWords.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {searchQuery ? "No words match your search" : "No words yet"}
                  </Text>
                </View>
              ) : (
                displayWords.map((item, index) => (
                  <TouchableOpacity
                    key={item.word}
                    style={[
                      styles.wordItem,
                      { backgroundColor: theme.cardBackground },
                      index < displayWords.length - 1 && { borderBottomColor: theme.divider },
                    ]}
                    onPress={() => {
                      // TODO: Show word detail modal with definition, usage stats
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onLongPress={() => {
                      // Long press to delete
                      Alert.alert("Remove Word", `Remove "${item.word}" from your list?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => handleRemoveWord(item.word),
                        },
                      ]);
                    }}
                  >
                    {/* Confidence Dots */}
                    <View style={styles.confidence}>
                      {[0, 1, 2, 3].map((dotIndex) => (
                        <View
                          key={dotIndex}
                          style={[
                            styles.confidenceDot,
                            {
                              backgroundColor:
                                dotIndex < item.confidence
                                  ? item.isMastered
                                    ? theme.accent // Gold for mastered
                                    : theme.accentSecondary // Blue for learning
                                  : theme.border, // Gray for empty
                            },
                          ]}
                        />
                      ))}
                    </View>

                    {/* Word Text */}
                    <Text
                      style={[
                        styles.wordText,
                        { color: theme.text },
                        item.isMastered && { opacity: 0.6 },
                      ]}
                    >
                      {item.word}
                    </Text>

                    {/* Mastered Checkmark */}
                    {item.isMastered && (
                      <View style={[styles.checkmark, { backgroundColor: theme.accent }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          /* Presets tab */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {presets.map((preset) => {
              const isActive = preset.id === activeList?.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: isActive ? theme.accentSecondary : theme.border,
                    },
                    isActive && { borderWidth: 2 },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleSwitchToPreset(preset)}
                >
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: theme.accentSecondary }]}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                  <Text style={[styles.presetName, { color: theme.text }]}>{preset.name}</Text>
                  <Text style={[styles.presetDesc, { color: theme.textSecondary }]}>
                    {CARD_DESCRIPTIONS[preset.name] || preset.description || "A curated vocabulary collection"}
                  </Text>
                  <View style={[styles.presetCount, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.presetCountText, { color: theme.textSecondary }]}>
                      {preset.wordCount} words
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 8,
  },
  backText: {
    fontSize: 32,
    fontWeight: "300",
    paddingRight: 12,
  },
  headerTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 28,
    flex: 1,
  },
  doneText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 17,
  },

  tabs: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 4,
  },
  tab: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Active list
  listHeader: {
    marginBottom: 20,
  },
  listName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 24,
    marginBottom: 6,
  },
  listMeta: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
  },

  // Search/Add
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
  searchHint: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    marginTop: 6,
    paddingHorizontal: 4,
  },

  // Sort Controls
  sortControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 13,
    fontFamily: FONT_FAMILIES.bodySemiBold,
    letterSpacing: 0.5,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
  },

  // Word List
  wordList: {
    borderRadius: 14,
    overflow: "hidden",
  },
  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confidence: {
    flexDirection: "row",
    gap: 4,
    marginRight: 14,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wordText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    textAlign: "center",
  },

  // Presets tab
  presetCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: "relative",
  },
  activeBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FONT_FAMILIES.bodySemiBold,
    letterSpacing: 0.5,
  },
  presetName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
    marginBottom: 6,
  },
  presetDesc: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  presetCount: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  presetCountText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 13,
  },
});