import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// 🔥 Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCGfUe9rHCEkfUreHGWLlK-U4t234DaRKA',
  authDomain: 'eco-basket-57984.firebaseapp.com',
  projectId: 'eco-basket-57984',
  storageBucket: 'eco-basket-57984.firebasestorage.app',
  messagingSenderId: '771227430175',
  appId: '1:771227430175:web:ee68286c9922f6431cd42a',
  measurementId: 'G-EVMSEDRPXK',
};

// 🌱 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };