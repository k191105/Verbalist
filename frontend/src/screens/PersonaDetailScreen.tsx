import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../hooks/useTheme";
import { FONT_FAMILIES } from "../config/fonts";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PersonaDetail">;
  route: RouteProp<RootStackParamList, "PersonaDetail">;
};

interface PersonaInfo {
  displayName: string;
  expertise: string;
  fullBio: string;
  conversationStyle: string;
  topics: string[];
}

const PERSONA_DATA: Record<string, PersonaInfo> = {
  chris: {
    displayName: "Chris",
    expertise: "Everyday conversation",
    fullBio: "Chris is opinionated and quick-witted, the kind of friend who always has a sharp take on culture, technology, and relationships. Conversations feel like texting someone who reads widely and thinks precisely.",
    conversationStyle: "Quick, confident bursts about everyday life. Takes positions and defends them, but is genuinely curious what you think.",
    topics: ["Culture", "Technology", "Relationships", "Daily life", "Current trends"],
  },
  gemma: {
    displayName: "Gemma",
    expertise: "Literature & arts",
    fullBio: "Gemma notices beauty in small things — a line in a song, the way a film was shot, a phrase in a novel. She has strong opinions about art and isn't afraid to champion the underrated or challenge the overhyped.",
    conversationStyle: "Specific cultural references, passionate positions on books, films, and music. Draws connections across works and eras.",
    topics: ["Literature", "Film", "Music", "Visual arts", "Storytelling"],
  },
  eva: {
    displayName: "Eva",
    expertise: "Philosophy & psychology",
    fullBio: "Eva leads with questions that make you pause. She's interested in why people behave the way they do, what words really mean when you push on them, and the gap between how we act and what we actually think.",
    conversationStyle: "Probing questions about the nature of things. Applies philosophical and psychological insight to real situations, never abstractly.",
    topics: ["Human behaviour", "Ethics", "Consciousness", "Meaning", "Identity"],
  },
  sid: {
    displayName: "Sid",
    expertise: "History & politics",
    fullBio: "Sid makes the past feel alive and urgent. He leads with stories — surprising historical anecdotes, forgotten episodes, and striking parallels between then and now. He challenges you to articulate your own positions.",
    conversationStyle: "Vivid historical narratives, current-event analysis, and direct challenges to engage your own knowledge and memory.",
    topics: ["World history", "Geopolitics", "Economics", "Current events", "Power dynamics"],
  },
};

const PERSONA_COLORS: Record<string, string> = {
  chris: "#3B5CC6",
  gemma: "#D4983F",
  eva: "#7C4DDB",
  sid: "#1A9A6B",
};

export default function PersonaDetailScreen({ navigation, route }: Props) {
  const { personaId } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const persona = PERSONA_DATA[personaId] || PERSONA_DATA.chris;
  const color = PERSONA_COLORS[personaId] || PERSONA_COLORS.chris;

  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 450, delay: 120, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 450, delay: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header bar */}
      <Animated.View style={[styles.headerBar, { paddingTop: insets.top, opacity: headerFade }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={[styles.backBtnText, { color: theme.accent }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>

          {/* Avatar + name */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarLarge, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>{persona.displayName.charAt(0)}</Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{persona.displayName}</Text>
            <Text style={[styles.expertise, { color: theme.textSecondary }]}>{persona.expertise}</Text>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ABOUT</Text>
            <Text style={[styles.sectionBody, { color: theme.text }]}>{persona.fullBio}</Text>
          </View>

          {/* Conversation style */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CONVERSATION STYLE</Text>
            <Text style={[styles.sectionBody, { color: theme.text }]}>{persona.conversationStyle}</Text>
          </View>

          {/* Topics */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TOPICS</Text>
            <View style={styles.topicsRow}>
              {persona.topics.map((topic) => (
                <View key={topic} style={[styles.topicChip, { borderColor: theme.border }]}>
                  <Text style={[styles.topicChipText, { color: theme.text }]}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 34,
    fontWeight: "300",
  },

  scrollContent: {
    paddingHorizontal: 28,
  },

  profileHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 36,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarText: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 40,
    color: "#FFFFFF",
  },
  name: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 30,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  expertise: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
  },

  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    lineHeight: 26,
  },

  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicChipText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
});
