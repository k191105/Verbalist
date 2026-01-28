import Constants from "expo-constants";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
