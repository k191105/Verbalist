import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { FONT_FAMILIES } from "../config/fonts";
import type { ThemeColors } from "../config/theme";

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  theme: ThemeColors;
  isPremium?: boolean;
  personaName?: string; // e.g. "Gemma" for persona-specific prompts
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  theme,
  isPremium = false,
  personaName,
}: UpgradePromptProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const title = isPremium 
    ? "You've earned your rest!" 
    : personaName 
    ? `Meet ${personaName}` 
    : "Daily Limit Reached";

  const subtitle = isPremium
    ? "You've completed all 8 chats today. Come back tomorrow for more conversations!"
    : personaName
    ? `${personaName} specializes in literary vocabulary and brings a sophisticated perspective to conversations.`
    : "You've used all your chats for today";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: "#FFFFFF", transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.pullHandle, { backgroundColor: theme.textSecondary }]} />
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.drawerContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {subtitle}
                </Text>
              </View>

              {!isPremium && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />

                  {/* Features intro */}
                  <Text style={[styles.featureIntro, { color: theme.text }]}>
                    {personaName ? `${personaName} joins conversations with Verbalist Premium.` : "Unlock unlimited learning with Premium."}
                  </Text>

                  {/* Features list */}
                  <View style={styles.featuresList}>
                    <FeatureItem text="5 daily conversations, plus bonuses" theme={theme} />
                    <FeatureItem text="All four personas (Chris, Gemma, Eva, Sid)" theme={theme} />
                    <FeatureItem text="Create custom word lists" theme={theme} />
                    <FeatureItem text="Advanced progress tracking" theme={theme} />
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />

                  {/* Plan options */}
                  <TouchableOpacity
                    style={[
                      styles.planOption,
                      selectedPlan === "annual" && styles.planOptionSelected,
                      { borderColor: selectedPlan === "annual" ? theme.accentTertiary : "rgba(15, 25, 57, 0.1)" }
                    ]}
                    onPress={() => setSelectedPlan("annual")}
                    activeOpacity={0.8}
                  >
                    {selectedPlan === "annual" && (
                      <View style={[styles.bestValueBadge, { backgroundColor: theme.accentTertiary }]}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </View>
                    )}
                    <View style={styles.planHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>Annual</Text>
                      <View style={styles.planPrice}>
                        <Text style={[styles.priceAmount, { color: theme.text }]}>$68</Text>
                        <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>/year</Text>
                      </View>
                    </View>
                    <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
                      Best value for regular learners
                    </Text>
                    <Text style={[styles.monthlyBreakdown, { color: theme.accent }]}>
                      $5.67/month • Save 30%
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.planOption,
                      selectedPlan === "monthly" && styles.planOptionSelected,
                      { borderColor: selectedPlan === "monthly" ? theme.accentTertiary : "rgba(15, 25, 57, 0.1)" }
                    ]}
                    onPress={() => setSelectedPlan("monthly")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                      <View style={styles.planPrice}>
                        <Text style={[styles.priceAmount, { color: theme.text }]}>$8</Text>
                        <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>/month</Text>
                      </View>
                    </View>
                    <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
                      Flexible monthly subscription
                    </Text>
                  </TouchableOpacity>

                  {/* CTA Button */}
                  <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: theme.accentTertiary }]}
                    onPress={onUpgrade}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.ctaButtonText}>Start 7-Day Free Trial</Text>
                  </TouchableOpacity>

                  {/* Secondary actions */}
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                      <Text style={[styles.secondaryLink, { color: theme.accentSecondary }]}>
                        {personaName ? "Continue with Chris" : "Maybe later"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={[styles.secondaryLink, { color: theme.accentSecondary }]}>
                        Restore purchases
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Terms */}
                  <Text style={[styles.terms, { color: theme.textSecondary }]}>
                    Free trial for new subscribers. Auto-renews after trial. Cancel anytime.{"\n"}
                    <Text style={{ color: theme.accentSecondary }}>Terms</Text> • <Text style={{ color: theme.accentSecondary }}>Privacy</Text>
                  </Text>
                </>
              )}

              {isPremium && (
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: theme.accentTertiary, marginTop: 24 }]}
                  onPress={onClose}
                  activeOpacity={0.9}
                >
                  <Text style={styles.ctaButtonText}>Got it</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function FeatureItem({ text, theme }: { text: string; theme: ThemeColors }) {
  return (
    <View style={styles.featureItem}>
      <Text style={[styles.featureBullet, { color: theme.accentSecondary }]}>•</Text>
      <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 25, 57, 0.2)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 20,
  },
  pullHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 28,
    opacity: 0.15,
  },
  scrollView: {
    flex: 1,
  },
  drawerContent: {
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    lineHeight: 26,
  },
  divider: {
    height: 1,
    marginVertical: 28,
    opacity: 0.08,
  },
  featureIntro: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 28,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  featureBullet: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 24,
  },
  planOption: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: "relative",
  },
  planOptionSelected: {
    backgroundColor: "rgba(38, 66, 139, 0.02)",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FONT_FAMILIES.bodySemiBold,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
  },
  planPrice: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 24,
  },
  pricePeriod: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
  },
  planDescription: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    lineHeight: 20,
  },
  monthlyBreakdown: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    marginTop: 4,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  ctaButtonText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 17,
    color: "#FFFFFF",
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 8,
  },
  secondaryLink: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
  },
  terms: {
    textAlign: "center",
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
