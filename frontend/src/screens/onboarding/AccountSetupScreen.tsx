import { useEffect, useRef, useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { THEMES } from "../../config/theme";
import { FONT_FAMILIES, FONT_SIZES } from "../../config/fonts";
import ProgressIndicator from "../../components/ProgressIndicator";
import { useAuth } from "../../hooks/useAuth";
import { updateUserName } from "../../services/firestore";

// Use Lapis theme (same as first screen - themes cycle)
const theme = THEMES.lapis;

type AccountSetupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AccountSetup">;
};

export default function AccountSetupScreen({ navigation }: AccountSetupScreenProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header fade in
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Content fade in
    setTimeout(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Button fade in and pulse
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
    }, 400);
  }, []);

  const handleStepPress = (step: number) => {
    if (step === 1) {
      navigation.navigate("Welcome");
    } else if (step === 2) {
      navigation.navigate("WordListSelection");
    } else if (step === 3) {
      navigation.goBack();
    }
  };

  const handleStartLearning = useCallback(async () => {
    if (!user?.id) {
      console.error("No user ID available");
      return;
    }

    setIsSaving(true);
    try {
      // Save name if provided
      if (name.trim()) {
        await updateUserName(user.id, name.trim());
      }
      navigation.navigate("Chat");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [name, user, navigation]);

  const handleSkip = () => {
    navigation.navigate("Chat");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={4}
          totalSteps={4}
          theme="lapis"
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
          <Text style={styles.title}>Almost there!</Text>
          <Text style={styles.subtitle}>
            Personalize your experience and save your progress
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>What should we call you?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />
          </View>

          {/* Sign In Options - Coming Soon */}
          <View style={styles.signInSection}>
            <Text style={styles.signInLabel}>Save your progress</Text>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>Sign In Options</Text>
              <Text style={styles.comingSoonText}>
                Connect with Google, Apple, or email to sync your progress across devices
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={{
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.button, isSaving && styles.buttonDisabled]}
              onPress={handleStartLearning}
              activeOpacity={0.9}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.buttonText} />
              ) : (
                <Text style={styles.buttonText}>
                  {name.trim() ? `Let's go, ${name.trim()}!` : "Start Learning"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 42,
    color: theme.text,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    color: theme.textSecondary,
    lineHeight: 26,
  },
  content: {
    flex: 1,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 15,
    color: theme.text,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 18,
    color: theme.text,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  signInSection: {
    flex: 1,
  },
  signInLabel: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 15,
    color: theme.text,
    marginBottom: 12,
  },
  comingSoonCard: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  comingSoonTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
    color: theme.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: theme.accentSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comingSoonBadgeText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 12,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: theme.buttonBackground,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: theme.buttonBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.bodyLarge,
    color: theme.buttonText,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    color: theme.textSecondary,
  },
});
