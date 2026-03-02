import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import WordListSelectionScreen from "../screens/onboarding/WordListSelectionScreen";
import CustomWordListScreen from "../screens/onboarding/CustomWordListScreen";
import PresetDetailScreen from "../screens/onboarding/PresetDetailScreen";
import AccountSetupScreen from "../screens/onboarding/AccountSetupScreen";
import ChatScreen from "../screens/chat/ChatScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import PastChatScreen from "../screens/chat/PastChatScreen";
import PersonaDetailScreen from "../screens/PersonaDetailScreen";
import WordListEditorScreen from "../screens/WordListEditorScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import { useTheme } from "../hooks/useTheme";

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
  PastChat: { sessionId: string };
  PersonaDetail: { personaId: string };
  WordListEditor: undefined;
  Settings: undefined;
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
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="PastChat" component={PastChatScreen} />
        <Stack.Screen name="PersonaDetail" component={PersonaDetailScreen} />
        <Stack.Screen name="WordListEditor" component={WordListEditorScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
