// Import the functions you need from the SDKs you need
import { getApp, initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-a2b0a.firebaseapp.com",
  projectId: "interviewiq-a2b0a",
  storageBucket: "interviewiq-a2b0a.firebasestorage.app",
  messagingSenderId: "344362064918",
  appId: "1:344362064918:web:d11e7a602c7221c1fca937"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export {auth, provider}