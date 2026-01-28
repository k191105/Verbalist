import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { app } from "./src/services/firebase";
import { getTemplateWordLists } from "./src/services/firestore";

export default function App() {
  useEffect(() => {
    console.log(`Firebase initialized: ${app.name}`);
    getTemplateWordLists()
      .then((lists) => {
        console.log("Template word lists:", lists.map((list) => list.name));
      })
      .catch((error) => {
        console.error("Failed to load template word lists:", error);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Verbalist</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'center',
  },
});
