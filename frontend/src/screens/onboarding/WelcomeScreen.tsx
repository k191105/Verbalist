import { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { THEMES } from "../../config/theme";
import { FONT_FAMILIES, FONT_SIZES } from "../../config/fonts";
import ProgressIndicator from "../../components/ProgressIndicator";

// Use Lapis theme for Welcome screen
const theme = THEMES.lapis;

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Welcome">;
};

// Messages alternating like iMessage conversation
const MESSAGES = [
  {
    type: "received" as const,
    title: "Natural Dialogue",
    text: "Chat with AI that uses your target words organically, like texting a well-read friend",
  },
  {
    type: "sent" as const,
    title: "Spaced Repetition",
    text: "Words reappear exactly when you need to review them, building lasting retention",
  },
  {
    type: "received" as const,
    title: "Contextual Learning",
    text: "Master not just definitions, but usage, connotation, and real-world application",
  },
];

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [showButton, setShowButton] = useState(false);
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // Each message has opacity and translateX for slide-in
  const messageAnimations = useRef(
    MESSAGES.map((msg) => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(msg.type === "received" ? -100 : 100),
    }))
  ).current;

  useEffect(() => {
    // Header fade in + slide down
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Sequential message slide-ins - 500ms per message, each starts after previous finishes
    const messageDuration = 500;
    const initialDelay = 400;
    
    MESSAGES.forEach((_, index) => {
      const startTime = initialDelay + (index * messageDuration);
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(messageAnimations[index].opacity, {
            toValue: 1,
            duration: messageDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(messageAnimations[index].translateX, {
            toValue: 0,
            duration: messageDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, startTime);
    });

    // Button appears after all messages
    const buttonDelay = initialDelay + (MESSAGES.length * messageDuration) + 100;
    setTimeout(() => {
      setShowButton(true);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.03,
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
    }, buttonDelay);
  }, []);

  const handlePress = () => {
    navigation.navigate("WordListSelection");
  };

  const handleStepPress = (step: number) => {
    if (step === 2) {
      navigation.navigate("WordListSelection");
    } else if (step === 3) {
      navigation.navigate("CustomWordList");
    } else if (step === 4) {
      navigation.navigate("AccountSetup");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator - Clickable */}
      <ProgressIndicator 
        currentStep={1} 
        totalSteps={3}
        theme="lapis" 
        onStepPress={handleStepPress}
      />

      {/* Header Section */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.logo}>Verbalist</Text>
        <Text style={styles.tagline}>
          Learn vocabulary through real conversation. No flashcards. No drills. Just talk.
        </Text>
      </Animated.View>

      {/* Message Bubbles - Sequential slide-in from left/right */}
      <View style={styles.messagesContainer}>
        {MESSAGES.map((message, index) => (
          <Animated.View
            key={index}
            style={[
              styles.messageBubble,
              message.type === "sent" ? styles.sentBubble : styles.receivedBubble,
              {
                opacity: messageAnimations[index].opacity,
                transform: [{ translateX: messageAnimations[index].translateX }],
              },
            ]}
          >
            <Text
              style={[
                styles.messageTitle,
                message.type === "sent" && styles.sentText
              ]}
            >
              {message.title}
            </Text>
            <Text
              style={[
                styles.messageText,
                message.type === "sent" && styles.sentText
              ]}
            >
              {message.text}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* CTA Button - Appears after messages */}
      {showButton && (
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Begin Your Journey</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 22,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  logo: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 58,
    color: theme.text,
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.accentSecondary,
    opacity: 0.85,
  },
  messagesContainer: {
    flex: 1,
    gap: 14,
    marginBottom: 24,
  },
  messageBubble: {
    maxWidth: "90%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 22,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  receivedBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.surfaceAlt,
    borderBottomLeftRadius: 6,
  },
  sentBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.accentTertiary,
    borderBottomRightRadius: 6,
  },
  messageTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
    color: theme.text,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 23,
    color: theme.textSecondary,
  },
  sentText: {
    color: "#FFFFFF",
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
  buttonText: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.bodyLarge,
    color: theme.buttonText,
  },
});
