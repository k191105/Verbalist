/**
 * Paywall drawer matching paywall.dart design.
 * Integrates RevenueCat for offerings, purchase, and restore.
 * Slides up as a bottom drawer (like Dev panel).
 */

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
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { FONT_FAMILIES } from "../config/fonts";
import type { ThemeColors } from "../config/theme";
import { usePurchases } from "../hooks/usePurchases";
import {
  purchasePackage,
  restorePurchases,
  hasProEntitlement,
  isUserCancelledError,
} from "../services/purchases";
import type { PurchasesPackage } from "react-native-purchases";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FEATURE_BULLETS = [
  "8 daily conversations with bonuses",
  "All four personas: Chris, Gemma, Eva, Sid",
  "Create custom word lists",
  "Advanced progress tracking & SRS",
];

/** Feature groups for "Everything in Pro" expandable (paywall.dart style) */
const PRO_FEATURE_GROUPS: Record<string, string[]> = {
  Conversations: [
    "8 daily chats plus mastery bonuses",
    "All four personas: Chris, Gemma, Eva, Sid",
    "Session recovery across app restarts",
  ],
  Learn: [
    "SRS & spaced repetition",
    "Progress tracking & words mastered",
    "Custom word lists & priorities",
  ],
  Customize: [
    "Premium themes (Lapis, Obsidian, Porcelain)",
    "Chat background options",
    "Priority words & learn again",
  ],
};

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  theme: ThemeColors;
  isPremium?: boolean;
  personaName?: string;
  contextKey?: "daily_limit" | "persona" | "settings" | "default";
}

function contextualHeadline(
  contextKey: string | undefined,
  personaName?: string,
  isPremium?: boolean
): string {
  if (isPremium) return "You've earned your rest!";
  switch (contextKey) {
    case "daily_limit":
      return "Daily Limit Reached";
    case "persona":
      return personaName ? `Meet ${personaName}` : "Unlock More Personas";
    case "settings":
      return "Unlock Verbalist Pro";
    default:
      return "Read smarter. Unlock more.";
  }
}

function contextualSubtitle(
  contextKey: string | undefined,
  personaName?: string,
  isPremium?: boolean
): string {
  if (isPremium)
    return "You've completed all 8 chats today. Come back tomorrow!";
  if (contextKey === "persona" && personaName)
    return `${personaName} brings literary vocabulary and a sophisticated perspective.`;
  if (contextKey === "daily_limit")
    return "You've used all your chats for today.";
  return "Unlock unlimited learning with Verbalist Pro.";
}

export default function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  theme,
  isPremium = false,
  personaName,
  contextKey = "default",
}: UpgradePromptProps) {
  const {
    isPro,
    offering,
    getMonthlyPackage,
    getYearlyPackage,
    refresh,
  } = usePurchases();

  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [allProExpanded, setAllProExpanded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  useEffect(() => {
    if (visible && isPro) {
      onClose();
    }
  }, [visible, isPro, onClose]);

  const yearlyPkg = getYearlyPackage();
  const monthlyPkg = getMonthlyPackage();

  const displayPrice = (pkg: PurchasesPackage | null): string => {
    if (!pkg?.product?.priceString) return "—";
    return pkg.product.priceString;
  };

  const ctaLabel = (): string => {
    const pkg = selectedPlan === "annual" ? yearlyPkg : monthlyPkg;
    const intro = pkg?.product?.introPrice;
    if (intro?.priceString) return `Start ${intro.priceString} Trial`;
    return "Continue";
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === "annual" ? yearlyPkg : monthlyPkg;
    if (!pkg) {
      Alert.alert("Error", "Products are still loading. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const { customerInfo } = await purchasePackage(pkg);
      if (hasProEntitlement(customerInfo)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUpgrade?.();
        onClose();
      }
    } catch (e) {
      if (!isUserCancelledError(e)) {
        Alert.alert("Purchase Failed", e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    try {
      const customerInfo = await restorePurchases();
      if (hasProEntitlement(customerInfo)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refresh();
        onUpgrade?.();
        onClose();
      } else {
        Alert.alert("No Purchases Found", "No active subscription to restore.");
      }
    } catch (e) {
      Alert.alert("Restore Failed", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRestoreLoading(false);
    }
  };

  if (!visible) return null;

  const proActive = isPro || isPremium;
  const title = contextualHeadline(contextKey, personaName, isPremium);
  const subtitle = contextualSubtitle(contextKey, personaName, isPremium);

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
            { backgroundColor: theme.cardBackground, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.pullHandle, { backgroundColor: theme.textSecondary }]} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header — paywall.dart style: app branding + headline */}
            <View style={styles.header}>
              <View style={styles.headerBrand}>
                <Text style={[styles.appName, { color: theme.accentSecondary }]}>
                  Verbalist
                </Text>
                <View style={[styles.proBadge, { backgroundColor: theme.accentTertiary }]}>
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
              </View>
              <Text style={[styles.headline, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            </View>

            {proActive ? (
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: theme.accentTertiary }]}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <Text style={styles.ctaButtonText}>Got it</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Bullets — paywall.dart style with gradient dots */}
                <View style={styles.bullets}>
                  {FEATURE_BULLETS.map((bullet, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <LinearGradient
                        colors={[theme.accentSecondary, theme.accentTertiary]}
                        style={styles.bulletDot}
                      />
                      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Expandable: Everything in Pro — paywall.dart _buildAllProFeaturesExpandable */}
                <TouchableOpacity
                  style={[styles.expandableHeader, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAllProExpanded((e) => !e);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.expandableIcon, { color: theme.accentTertiary }]}>✦</Text>
                  <Text style={[styles.expandableTitle, { color: theme.text }]}>
                    Everything in Pro
                  </Text>
                  <Text style={[styles.expandableChevron, { color: theme.textSecondary }]}>
                    {allProExpanded ? "▼" : "▶"}
                  </Text>
                </TouchableOpacity>
                {allProExpanded && (
                  <View style={styles.expandableContent}>
                    {Object.entries(PRO_FEATURE_GROUPS).map(([groupName, items]) => (
                      <View key={groupName} style={styles.featureGroup}>
                        <Text style={[styles.featureGroupTitle, { color: theme.text }]}>
                          {groupName}
                        </Text>
                        {items.map((item, i) => (
                          <View key={i} style={styles.featureItem}>
                            <Text style={[styles.featureCheck, { color: theme.success }]}>✓</Text>
                            <Text style={[styles.featureItemText, { color: theme.textSecondary }]}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {/* Plan cards */}
                <View style={styles.planCards}>
                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      selectedPlan === "annual" && styles.planCardSelected,
                      {
                        borderColor: selectedPlan === "annual" ? theme.accentTertiary : theme.border,
                        backgroundColor: selectedPlan === "annual" ? `${theme.accentTertiary}08` : theme.surface,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlan("annual");
                    }}
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>
                        Pro Annual
                      </Text>
                      <View style={[styles.bestValueBadge, { backgroundColor: theme.accentTertiary }]}>
                        <Text style={styles.bestValueText}>Best Value</Text>
                      </View>
                    </View>
                    <Text style={[styles.planPrice, { color: theme.text }]}>
                      {displayPrice(yearlyPkg)}
                    </Text>
                    <Text style={[styles.planPerMonth, { color: theme.textSecondary }]}>
                      {yearlyPkg?.product?.introPrice
                        ? `Free trial, then ${yearlyPkg.product.priceString}/year`
                        : yearlyPkg?.product?.pricePerMonthString
                          ? `${yearlyPkg.product.pricePerMonthString}/month • Best value`
                          : "Best value for regular learners"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      selectedPlan === "monthly" && styles.planCardSelected,
                      {
                        borderColor: selectedPlan === "monthly" ? theme.accentTertiary : theme.border,
                        backgroundColor: selectedPlan === "monthly" ? `${theme.accentTertiary}08` : theme.surface,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlan("monthly");
                    }}
                  >
                    <View style={styles.planCardHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>
                        Pro Monthly
                      </Text>
                    </View>
                    <Text style={[styles.planPrice, { color: theme.text }]}>
                      {displayPrice(monthlyPkg)}
                    </Text>
                    <Text style={[styles.planPerMonth, { color: theme.textSecondary }]}>
                      Flexible monthly subscription
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CTA - gradient like paywall.dart */}
                <TouchableOpacity
                  style={styles.ctaWrapper}
                  onPress={handlePurchase}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[theme.accentSecondary, theme.accentTertiary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.ctaButtonText}>{ctaLabel()}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Secondary actions */}
                <View style={styles.secondaryActions}>
                  <TouchableOpacity
                    onPress={() => setSelectedPlan("monthly")}
                    disabled={loading}
                  >
                    <Text style={[styles.secondaryLink, { color: theme.textSecondary }]}>
                      See monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRestore}
                    disabled={restoreLoading}
                  >
                    {restoreLoading ? (
                      <ActivityIndicator size="small" color={theme.accentSecondary} />
                    ) : (
                      <Text style={[styles.secondaryLink, { color: theme.accentSecondary }]}>
                        Restore purchases
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Legal footer — paywall.dart _buildLegalFooter style */}
                <View style={styles.legalFooter}>
                  <Text style={[styles.terms, { color: theme.textSecondary }]}>
                    Free trial for new subscribers. Auto-renews after trial. Cancel anytime.
                  </Text>
                  <Text style={[styles.termsSmall, { color: theme.textSecondary }]}>
                    Cancel anytime • Keep your progress and word lists
                  </Text>
                  <View style={styles.legalLinks}>
                    <TouchableOpacity>
                      <Text style={[styles.legalLink, { color: theme.accentSecondary }]}>
                        Privacy
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.terms, { color: theme.textSecondary }]}> • </Text>
                    <TouchableOpacity>
                      <Text style={[styles.legalLink, { color: theme.accentSecondary }]}>
                        Terms
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
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
    paddingTop: 12,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.85,
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
    marginBottom: 24,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  appName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 32,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  proBadgeText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  headline: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.85,
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  expandableIcon: {
    fontSize: 16,
  },
  expandableTitle: {
    flex: 1,
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 16,
  },
  expandableChevron: {
    fontSize: 20,
    fontWeight: "300",
  },
  expandableContent: {
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  featureGroup: {
    marginBottom: 16,
  },
  featureGroupTitle: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    marginBottom: 8,
    opacity: 0.9,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  featureCheck: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
  featureItemText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bullets: {
    marginBottom: 24,
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 22,
  },
  planCards: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 18,
  },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 24,
  },
  planPerMonth: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    marginTop: 4,
  },
  ctaWrapper: {
    marginBottom: 16,
    borderRadius: 25,
    overflow: "hidden",
  },
  ctaGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
  },
  ctaButtonText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
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
  },
  termsSmall: {
    textAlign: "center",
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    opacity: 0.85,
  },
  legalFooter: {
    marginTop: 8,
    paddingTop: 16,
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  legalLink: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
  },
});
