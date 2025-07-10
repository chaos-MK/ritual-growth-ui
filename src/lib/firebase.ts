import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "REMOVED_FIREBASE_API_KEY",
  authDomain: "ritual-growth-ui-f7055.firebaseapp.com",
  projectId: "ritual-growth-ui-f7055",
  storageBucket: "ritual-growth-ui-f7055.firebasestorage.app",
  messagingSenderId: "924265948912",
  appId: "1:924265948912:web:7b5cd3582f4cbfdf770435",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
