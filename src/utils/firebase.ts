import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAVvzHfiFAymGpNxxqZUEzvRQIuNw-Bd5k",
  authDomain: "docpath-437da.firebaseapp.com",
  projectId: "docpath-437da",
  storageBucket: "docpath-437da.firebasestorage.app",
  messagingSenderId: "433889054829",
  appId: "1:433889054829:web:41346382cfc4de3a34af64",
  measurementId: "G-31F59E8LBB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
