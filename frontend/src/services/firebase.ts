import Constants from "expo-constants";
import { getApps, initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const firebaseConfig = Constants.expoConfig?.extra?.firebase as
  | FirebaseConfig
  | undefined;

if (!firebaseConfig) {
  throw new Error("Missing Firebase config in app.json extras.");
}

const alreadyInitialized = getApps().length > 0;
const app = alreadyInitialized ? getApps()[0] : initializeApp(firebaseConfig);

const auth = alreadyInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

const firestore = getFirestore(app);

export { app, auth, firestore };
