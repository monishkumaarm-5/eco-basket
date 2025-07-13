import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// 🔥 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMzRiK7BY6nCxkDmfDWuo-0umcwZPLZ6g",
  authDomain: "eco-basket-c3fe1.firebaseapp.com",
  projectId: "eco-basket-c3fe1",
  storageBucket: "eco-basket-c3fe1.firebasestorage.app",
  messagingSenderId: "920189761891",
  appId: "1:920189761891:web:c62ea1d41630be59aabb56",
  measurementId: "G-F9CGQ2MP81"
};

// 🌱 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };