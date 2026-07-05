import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyARQTp23ZKA5wgFWqnuJ-jTBzA-BjffdQU",
  authDomain: "cravzo-de18f.firebaseapp.com",
  projectId: "cravzo-de18f",
  storageBucket: "cravzo-de18f.firebasestorage.app",
  messagingSenderId: "340045264237",
  appId: "1:340045264237:web:91c2182b17a99c31655664",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export const auth = firebase.auth();
