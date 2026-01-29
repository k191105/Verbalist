import { useEffect, useRef, useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { THEMES } from "../../config/theme";
import { FONT_FAMILIES, FONT_SIZES } from "../../config/fonts";
import ProgressIndicator from "../../components/ProgressIndicator";
import { parseAndValidateWords, type ValidationResult } from "../../utils/wordValidator";
import { useAuth } from "../../hooks/useAuth";
import { createAndSetCustomWordList } from "../../services/firestore";

// Use Porcelain theme for Custom Word List screen
const theme = THEMES.porcelain;

const MIN_WORDS = 20;

type CustomWordListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CustomWordList">;
  route: RouteProp<RootStackParamList, "CustomWordList">;
};

export default function CustomWordListScreen({
  navigation,
  route,
}: CustomWordListScreenProps) {
  const { user } = useAuth();
  const params = route.params;
  
  const [inputText, setInputText] = useState("");
  const [validWords, setValidWords] = useState<string[]>(params?.initialWords || []);
  const [invalidWord, setInvalidWord] = useState<ValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [listName] = useState(params?.listName || "My Word List");

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

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

    // Content fade in + slide up (delay 300ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  // Parse and validate words from input
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    setInvalidWord(null);
  }, []);

  // Add words when user presses done or submits
  const handleAddWords = useCallback(() => {
    if (!inputText.trim()) return;
    
    const { valid, invalid } = parseAndValidateWords(inputText);
    
    if (invalid.length > 0) {
      setInvalidWord(invalid[0]);
    }
    
    if (valid.length > 0) {
      setValidWords(prev => {
        const existingSet = new Set(prev);
        const newWords = valid.filter(w => !existingSet.has(w));
        return [...prev, ...newWords];
      });
      setInputText("");
    }
  }, [inputText]);

  // Remove a word from the list
  const handleRemoveWord = useCallback((wordToRemove: string) => {
    setValidWords(prev => prev.filter(w => w !== wordToRemove));
  }, []);

  // Trigger shake animation
  const triggerShake = useCallback(() => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnimation]);

  const handleStartLearning = useCallback(async () => {
    if (validWords.length < MIN_WORDS) {
      triggerShake();
      return;
    }
    
    if (!user?.id) {
      console.error("No user ID available");
      return;
    }

    setIsSaving(true);
    try {
      await createAndSetCustomWordList(user.id, listName, validWords);
      navigation.navigate("AccountSetup");
    } catch (error) {
      console.error("Failed to save word list:", error);
      triggerShake();
    } finally {
      setIsSaving(false);
    }
  }, [validWords, user, listName, triggerShake, navigation]);

  const handleStepPress = (step: number) => {
    if (step === 1) {
      navigation.navigate("Welcome");
    } else if (step === 2) {
      navigation.navigate("WordListSelection");
    } else if (step === 4) {
      navigation.navigate("AccountSetup");
    }
  };

  const progress = Math.min((validWords.length / MIN_WORDS) * 100, 100);
  const isReady = validWords.length >= MIN_WORDS;
  const wordsNeeded = MIN_WORDS - validWords.length;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Progress Indicator - Clickable */}
        <ProgressIndicator 
          currentStep={3} 
          totalSteps={3}
          theme="porcelain" 
          onStepPress={handleStepPress} 
        />

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[theme.accentTertiary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {isReady ? "Ready to begin!" : `${wordsNeeded} more word${wordsNeeded !== 1 ? "s" : ""} needed`}
          </Text>
        </View>

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
          <Text style={styles.title}>Your Collection</Text>
          <Text style={styles.subtitle}>
            Paste or type words to create your personalized learning list
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [
                { translateY: contentTranslateY },
                { translateX: shakeAnimation },
              ],
            },
          ]}
        >
          {/* Text Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="ecclesiastical, magnanimous, ephemeral, ubiquitous, perfunctory..."
              placeholderTextColor={`${theme.textMuted}66`}
              multiline
              textAlignVertical="top"
              onBlur={handleAddWords}
            />
          </View>

          {/* Invalid Word Warning */}
          {invalidWord && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                "{invalidWord.word}" — {invalidWord.reason}
              </Text>
            </View>
          )}

          {/* Word List */}
          <View style={styles.wordListContainer}>
            <View style={styles.wordListHeader}>
              <Text style={styles.wordListTitle}>Your Words</Text>
              <Text style={styles.wordCount}>
                <Text style={[styles.wordCountNumber, !isReady && styles.wordCountWarning]}>
                  {validWords.length}
                </Text> / {MIN_WORDS}
              </Text>
            </View>
            
            <ScrollView 
              style={styles.wordList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {validWords.length === 0 ? (
                <Text style={styles.emptyText}>
                  Words will appear here as you type...
                </Text>
              ) : (
                validWords.map((word) => (
                  <View key={word} style={styles.wordItem}>
                    <View style={styles.wordCheckmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                    <Text style={styles.wordText}>{word}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveWord(word)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.button, (!isReady || isSaving) && styles.buttonDisabled]}
          onPress={handleStartLearning}
          activeOpacity={0.9}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.surface,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: FONT_SIZES.caption,
    color: theme.accentTertiary,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 32,
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  inputWrapper: {
    height: 100,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    color: theme.text,
    textAlignVertical: "top",
  },
  warningContainer: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  warningText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    color: "#991B1B",
  },
  wordListContainer: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  wordListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  wordListTitle: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 14,
    color: theme.text,
  },
  wordCount: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    color: theme.textSecondary,
  },
  wordCountNumber: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    color: theme.accent,
  },
  wordCountWarning: {
    color: "#DC2626",
  },
  wordList: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emptyText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    paddingVertical: 20,
    opacity: 0.6,
  },
  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "rgba(188, 189, 228, 0.15)",
  },
  wordCheckmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  wordText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    color: theme.text,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 18,
    color: "#DC2626",
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.buttonBackground,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
    shadowColor: theme.buttonBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.bodyLarge,
    color: theme.buttonText,
  },
});
