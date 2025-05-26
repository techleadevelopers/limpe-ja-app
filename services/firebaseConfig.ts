import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBpGWwiPPfhU6ny8BaD56QostCynxCFxS0",
  authDomain: "limpe-ja-app.firebaseapp.com",
  projectId: "limpe-ja-app",
  storageBucket: "limpe-ja-app.firebasestorage.app",
  messagingSenderId: "814702572005",
  appId: "1:814702572005:web:95c27f35d8c831e5887f0c"
};

const app = initializeApp(firebaseConfig);

export default app;
