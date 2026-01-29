import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import WordListSelectionScreen from "../screens/onboarding/WordListSelectionScreen";
import CustomWordListScreen from "../screens/onboarding/CustomWordListScreen";
import PresetDetailScreen from "../screens/onboarding/PresetDetailScreen";
import AccountSetupScreen from "../screens/onboarding/AccountSetupScreen";
import ChatScreen from "../screens/chat/ChatScreen";
import { useTheme } from "../hooks/useTheme";
import { THEMES } from "../config/theme";

export type RootStackParamList = {
  Welcome: undefined;
  WordListSelection: undefined;
  CustomWordList: {
    initialWords?: string[];
    listName?: string;
    listId?: string;
    isEditing?: boolean;
  } | undefined;
  PresetDetail: {
    listId: string;
    listName: string;
    wordCount: number;
    description: string;
    words: string[];
  };
  AccountSetup: undefined;
  Chat: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="WordListSelection" component={WordListSelectionScreen} />
        <Stack.Screen name="CustomWordList" component={CustomWordListScreen} />
        <Stack.Screen name="PresetDetail" component={PresetDetailScreen} />
        <Stack.Screen name="AccountSetup" component={AccountSetupScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        {/* Placeholder screens - will be implemented in future tasks */}
        <Stack.Screen
          name="Dashboard"
          component={PlaceholderScreen}
          options={{
            headerShown: true,
            title: "Dashboard",
            headerStyle: { backgroundColor: THEMES.lapis.background },
            headerTintColor: THEMES.lapis.text,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Temporary placeholder for screens not yet implemented
function PlaceholderScreen() {
  return (
    <View style={[styles.placeholder, { backgroundColor: THEMES.lapis.background }]}>
      <Text style={[styles.placeholderText, { color: THEMES.lapis.textSecondary }]}>
        Coming Soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
  },
});
