import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBKTq-ZKp9CO7jYnip1laMytyAW0uoILLs",
    authDomain: "kitrecordsystem.firebaseapp.com",
    projectId: "kitrecordsystem",
    storageBucket: "kitrecordsystem.firebasestorage.app",
    messagingSenderId: "50603660046",
    appId: "1:50603660046:web:598f81730b00aeca5afd5f"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
