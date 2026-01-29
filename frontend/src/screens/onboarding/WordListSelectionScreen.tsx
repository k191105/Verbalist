import { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import type { WordList } from "../../../../shared/types";
import { getTemplateWordLists } from "../../services/firestore";
import { THEMES } from "../../config/theme";
import { FONT_FAMILIES, FONT_SIZES } from "../../config/fonts";
import ProgressIndicator from "../../components/ProgressIndicator";

// Use Obsidian theme for Word List Selection screen
const theme = THEMES.obsidian;

const MAX_VISIBLE_CARDS = 4;

type WordListSelectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "WordListSelection">;
};

const CARD_DESCRIPTIONS: Record<string, string> = {
  "General High-Level Vocabulary": "Sophisticated vocabulary for everyday eloquence and professional discourse",
  "Literary and Rhetorical": "The language of literature, criticism, and persuasive expression",
  "Politics and Public Life": "Navigate discourse on governance, policy, and civic engagement",
};

const CARD_TITLES: Record<string, string> = {
  "General High-Level Vocabulary": "General High-Level",
  "Literary and Rhetorical": "Literary & Rhetorical",
  "Politics and Public Life": "Politics & Public Life",
};

export default function WordListSelectionScreen({
  navigation,
}: WordListSelectionScreenProps) {
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  
  const cardAnimations = useRef(
    Array.from({ length: 10 }, () => ({
      scale: new Animated.Value(0.95),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    getTemplateWordLists()
      .then(setWordLists)
      .catch((error) => console.error("Failed to load word lists:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Header fade in + slide down
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Cards scale in (staggered)
    cardAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100 + index * 100);
    });
  }, []);

  const handleSelectPreset = (list: WordList) => {
    navigation.navigate("PresetDetail", {
      listId: list.id,
      listName: CARD_TITLES[list.name] || list.name,
      wordCount: list.wordCount,
      description: CARD_DESCRIPTIONS[list.name] || list.description || "",
      words: list.words || [],
    });
  };

  const handleCreateCustom = () => {
    navigation.navigate("CustomWordList");
  };

  const handleStepPress = (step: number) => {
    if (step === 1) {
      navigation.navigate("Welcome");
    } else if (step === 3) {
      navigation.navigate("CustomWordList");
    } else if (step === 4) {
      navigation.navigate("AccountSetup");
    }
  };

  const getCardTitle = (name: string): string => CARD_TITLES[name] || name;
  const getCardDescription = (name: string): string => 
    CARD_DESCRIPTIONS[name] || "A curated collection of vocabulary words";

  // Determine which lists to show
  const hasMoreLists = wordLists.length > MAX_VISIBLE_CARDS;
  const visiblePresetLists = showAll 
    ? wordLists 
    : wordLists.slice(0, MAX_VISIBLE_CARDS - 1); // Reserve one spot for custom card

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  // Render cards in a 2-column grid
  const renderPresetCards = () => {
    const rows: JSX.Element[] = [];
    
    for (let i = 0; i < visiblePresetLists.length; i += 2) {
      const list1 = visiblePresetLists[i];
      const list2 = visiblePresetLists[i + 1];
      
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: cardAnimations[i].opacity,
                transform: [{ scale: cardAnimations[i].scale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectPreset(list1)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{getCardTitle(list1.name)}</Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {getCardDescription(list1.name)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{list1.wordCount} words</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {list2 ? (
            <Animated.View
              style={[
                styles.cardWrapper,
                {
                  opacity: cardAnimations[i + 1].opacity,
                  transform: [{ scale: cardAnimations[i + 1].scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelectPreset(list2)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{getCardTitle(list2.name)}</Text>
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {getCardDescription(list2.name)}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{list2.wordCount} words</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.cardWrapper} />
          )}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator - Clickable */}
      <ProgressIndicator 
        currentStep={2} 
        totalSteps={3}
        theme="obsidian" 
        onStepPress={handleStepPress} 
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>Select Word List</Text>
        <Text style={styles.subtitle}>Choose preset or create custom</Text>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preset Cards */}
        {renderPresetCards()}

        {/* Show More Button - only if there are more than MAX_VISIBLE lists */}
        {hasMoreLists && !showAll && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAll(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>
              Show {wordLists.length - MAX_VISIBLE_CARDS + 1} more word lists
            </Text>
            <Text style={styles.showMoreIcon}>▼</Text>
          </TouchableOpacity>
        )}

        {/* Custom Card (full width) */}
        <Animated.View
          style={[
            styles.customCardWrapper,
            {
              opacity: cardAnimations[visiblePresetLists.length].opacity,
              transform: [{ scale: cardAnimations[visiblePresetLists.length].scale }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.card, styles.customCard]}
            onPress={handleCreateCustom}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Create Custom List</Text>
              <Text style={styles.cardDescription}>
                Build your own vocabulary collection from any source
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Custom</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loader: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 36,
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.bodyLight,
    fontSize: FONT_SIZES.body,
    color: theme.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  customCardWrapper: {
    width: "100%",
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
  },
  customCard: {
    backgroundColor: theme.accentTertiary,
    borderColor: theme.accentSecondary,
  },
  cardContent: {
    flex: 1,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 17,
    color: theme.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(243, 146, 160, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 11,
    color: theme.accent,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: "rgba(243, 146, 160, 0.1)",
    borderRadius: 12,
    gap: 8,
  },
  showMoreText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 14,
    color: theme.accent,
  },
  showMoreIcon: {
    fontSize: 10,
    color: theme.accent,
  },
});
