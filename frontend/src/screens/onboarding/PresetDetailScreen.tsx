import { useEffect, useRef, useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Easing,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { THEMES } from "../../config/theme";
import { FONT_FAMILIES, FONT_SIZES } from "../../config/fonts";
import ProgressIndicator from "../../components/ProgressIndicator";
import { useAuth } from "../../hooks/useAuth";
import { createAndSetCustomWordList, updateActiveWordList } from "../../services/firestore";
import { parseAndValidateWords, type ValidationResult } from "../../utils/wordValidator";

// Use Porcelain theme for this screen
const theme = THEMES.porcelain;

const MIN_WORDS = 20;

type PresetDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PresetDetail">;
  route: RouteProp<RootStackParamList, "PresetDetail">;
};

export default function PresetDetailScreen({
  navigation,
  route,
}: PresetDetailScreenProps) {
  const { user } = useAuth();
  const { listName: initialListName, listId, wordCount: initialWordCount, description, words: initialWords } = route.params;
  
  const [isEditing, setIsEditing] = useState(false);
  const [listName, setListName] = useState(initialListName);
  const [words, setWords] = useState<string[]>(initialWords);
  const [inputText, setInputText] = useState("");
  const [invalidWord, setInvalidWord] = useState<ValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    setTimeout(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);

    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.02,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 600);
  }, []);

  const handleStepPress = (step: number) => {
    if (step === 1) {
      navigation.navigate("Welcome");
    } else if (step === 2) {
      navigation.navigate("WordListSelection");
    } else if (step === 4) {
      navigation.navigate("AccountSetup");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setListName("Custom List");
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setWords(prev => prev.filter(w => w !== wordToRemove));
  };

  const handleAddWords = useCallback(() => {
    if (!inputText.trim()) return;
    
    const { valid, invalid } = parseAndValidateWords(inputText);
    
    if (invalid.length > 0) {
      setInvalidWord(invalid[0]);
      return;
    }
    
    // Add new valid words, avoiding duplicates
    setWords(prev => {
      const existingSet = new Set(prev);
      const newWords = valid.filter(w => !existingSet.has(w));
      return [...prev, ...newWords];
    });
    
    setInputText("");
    setInvalidWord(null);
  }, [inputText]);

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

  const handleContinue = useCallback(async () => {
    if (!user?.id) {
      console.error("No user ID available");
      return;
    }

    if (words.length < MIN_WORDS) {
      triggerShake();
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        // Create a new custom list since user edited
        await createAndSetCustomWordList(user.id, listName, words);
      } else {
        // Use the preset list as-is
        await updateActiveWordList(user.id, listId);
      }
      navigation.navigate("AccountSetup");
    } catch (error) {
      console.error("Failed to save:", error);
      triggerShake();
    } finally {
      setIsSaving(false);
    }
  }, [user, words, isEditing, listName, listId, triggerShake, navigation]);

  const isReady = words.length >= MIN_WORDS;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={3} 
          totalSteps={3}
          theme="porcelain" 
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
          <View style={styles.headerRow}>
            <Text style={styles.title}>{listName}</Text>
            {!isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>{description}</Text>
        </Animated.View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: contentOpacity,
              transform: [{ translateX: shakeAnimation }],
            }
          ]}
        >
          {/* Input Box - only show when editing */}
          {isEditing && (
            <View style={styles.inputSection}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);
                  setInvalidWord(null);
                }}
                placeholder="Add more words..."
                placeholderTextColor={`${theme.textMuted}66`}
                onSubmitEditing={handleAddWords}
                returnKeyType="done"
              />
              {invalidWord && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    "{invalidWord.word}" — {invalidWord.reason}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Word List */}
          <View style={styles.wordListContainer}>
            <View style={styles.wordListHeader}>
              <Text style={styles.wordListTitle}>
                {isEditing ? "Your Words" : "Words in this list"}
              </Text>
              <Text style={styles.wordCount}>
                <Text style={[styles.wordCountNumber, !isReady && styles.wordCountWarning]}>
                  {words.length}
                </Text>
                {" "}/ {MIN_WORDS} min
              </Text>
            </View>
            
            <ScrollView 
              style={styles.wordList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {words.map((word) => (
                <View key={word} style={styles.wordItem}>
                  <View style={styles.wordCheckmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                  <Text style={styles.wordText}>{word}</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveWord(word)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            style={[styles.button, (!isReady || isSaving) && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
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
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 32,
    color: theme.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  editButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 13,
    color: "#FFFFFF",
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
  inputSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: theme.inputBackground,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    color: theme.text,
  },
  warningContainer: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
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
