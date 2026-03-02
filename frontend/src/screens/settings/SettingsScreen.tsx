import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { usePurchases } from "../../hooks/usePurchases";
import { FONT_FAMILIES } from "../../config/fonts";
import RevenueCatUI from "react-native-purchases-ui";
import { restorePurchases, hasProEntitlement } from "../../services/purchases";
import UpgradePrompt from "../../components/UpgradePrompt";
import { firestore } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updateUserPreferences } from "../../services/firestore";
import { deleteUserAccountCloud } from "../../services/accountDeletion";
import type { ThemeName } from "../../config/theme";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">;
};

const THEME_OPTIONS: { id: ThemeName; label: string }[] = [
  { id: "lapis", label: "Lapis" },
  { id: "obsidian", label: "Obsidian" },
  { id: "porcelain", label: "Porcelain" },
  { id: "system", label: "System" },
];

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, themeName, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isPro, refresh } = usePurchases();

  const [wordListName, setWordListName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const wlRef = doc(firestore, "wordLists", user.activeWordListId);
        const snap = await getDoc(wlRef);
        if (snap.exists()) {
          setWordListName(snap.data().name || "");
        }
      } catch {
        // Silently handle
      }
    })();
  }, [user]);

  // Sync Firestore theme only on initial load—don't overwrite manual selections.
  const hasAppliedInitialTheme = useRef(false);
  useEffect(() => {
    const preferred = user?.preferences?.themeName as ThemeName | undefined;
    if (!preferred || hasAppliedInitialTheme.current) return;
    hasAppliedInitialTheme.current = true;
    setTheme(preferred);
  }, [user?.preferences?.themeName, setTheme]);

  const handleThemeSelect = async (name: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(name);
    setShowThemePicker(false);
    if (user?.id) {
      try {
        await updateUserPreferences(user.id, { themeName: name });
      } catch (e) {
        console.warn("Failed to save theme:", e);
      }
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This is permanent. All your data will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "This cannot be undone. Your word lists, progress, and conversations will all be permanently deleted.",
              [
                { text: "Keep Account", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteUserAccountCloud();
                    } catch (e) {
                      console.error("Account deletion failed:", e);
                      Alert.alert("Error", "Could not delete account. Please try again.");
                      return;
                    }
                    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
                    signOut(); // Clear local auth state (Cloud Function already deleted Auth user)
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const isPremium = isPro;
  const initial = (user?.name || "U").charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.cardBackground, borderBottomColor: "rgba(0,0,0,0.08)" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backText, { color: theme.accentSecondary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Profile card */}
          <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{initial}</Text>
            </View>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || "User"}</Text>
            <View style={[styles.subscriptionBadge, { backgroundColor: theme.background }]}>
              <Text style={[styles.subscriptionText, { color: theme.accentSecondary }]}>
                {isPremium ? "Premium" : "Free Plan · 2 chats daily"}
              </Text>
            </View>
          </View>

          {/* Learning */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LEARNING</Text>
            <View style={[styles.group, { borderColor: "rgba(0,0,0,0.08)" }]}>
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("WordListEditor")}
              >
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Active Word List</Text>
                  <Text style={[styles.settingSublabel, { color: theme.textSecondary }]}>{wordListName || "General"}</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
            <View style={[styles.group, { borderColor: "rgba(0,0,0,0.08)" }]}>
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowThemePicker(true);
                }}
              >
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
                </View>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {THEME_OPTIONS.find((o) => o.id === themeName)?.label ?? themeName}
                </Text>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Notification</Text>
                  <Text style={[styles.settingSublabel, { color: theme.textSecondary }]}>Remind me to practice</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: "rgba(120,120,128,0.16)", true: theme.accentSecondary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity
                style={[styles.settingItem, styles.settingItemDisabled, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={() => setShowUpgrade(true)}
              >
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Chat Background</Text>
                </View>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACCOUNT</Text>
            <View style={[styles.group, { borderColor: "rgba(0,0,0,0.08)" }]}>
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (isPremium) {
                    try {
                      await RevenueCatUI.presentCustomerCenter();
                    } catch (e) {
                      console.warn("Customer Center:", e);
                    }
                  } else {
                    setShowUpgrade(true);
                  }
                }}
              >
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
                  </Text>
                  <Text style={[styles.settingSublabel, { color: theme.textSecondary }]}>
                    {isPremium ? "Cancel, change plan, restore purchases" : "8 chats daily, all personas"}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                disabled={restoreLoading}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRestoreLoading(true);
                  try {
                    const info = await restorePurchases();
                    await refresh();
                    if (hasProEntitlement(info)) {
                      Alert.alert("Restore Complete", "Your subscription has been restored.");
                    } else {
                      Alert.alert("No Purchases Found", "No active subscription to restore.");
                    }
                  } catch (e) {
                    Alert.alert("Restore Failed", e instanceof Error ? e.message : "Something went wrong.");
                  } finally {
                    setRestoreLoading(false);
                  }
                }}
              >
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Restore Purchases</Text>
                  <Text style={[styles.settingSublabel, { color: theme.textSecondary }]}>
                    Restore previous subscription
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ABOUT</Text>
            <View style={[styles.group, { borderColor: "rgba(0,0,0,0.08)" }]}>
              <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
                </View>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>1.0.0</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.cardBackground }]} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Policy</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.cardBackground }]} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Terms of Service</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.cardBackground }]} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Contact Support</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger zone */}
          <View style={styles.section}>
            <View style={[styles.group, { borderColor: "rgba(0,0,0,0.08)" }]}>
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={handleSignOut}
              >
                <Text style={styles.destructiveLabel}>Sign Out</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.06)" }]} />

              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.7}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.destructiveLabel}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={() => setShowUpgrade(false)}
        theme={theme}
        contextKey="settings"
      />

      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowThemePicker(false)}
          />
          <View
            style={[styles.themePicker, { backgroundColor: theme.cardBackground }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.themePickerTitle, { color: theme.text }]}>Theme</Text>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.themeOption,
                  opt.id === themeName && { backgroundColor: theme.surface },
                ]}
                onPress={() => handleThemeSelect(opt.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.themeOptionText, { color: theme.text }]}>{opt.label}</Text>
                {opt.id === themeName && <Text style={{ color: theme.accent }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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

  scrollContent: {
    paddingTop: 0,
  },

  // Profile card
  profileCard: {
    margin: 20,
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#E3AF64",
  },
  profileInitial: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 36,
    color: "#FFFFFF",
  },
  profileName: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 22,
    marginBottom: 10,
  },
  subscriptionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subscriptionText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginBottom: 2,
  },
  settingSublabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
  },
  settingValue: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginRight: 8,
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },

  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  premiumBadgeText: {
    fontFamily: FONT_FAMILIES.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: "#D4983F",
  },

  destructiveLabel: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    color: "#FF3B30",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  themePicker: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
  },
  themePickerTitle: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 20,
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  themeOptionText: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
});
