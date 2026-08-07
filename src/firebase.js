// Firebase 프로젝트 연결 설정.
// 이 값들은 비밀키가 아니라 "어느 프로젝트에 연결할지" 알려주는 공개 식별자예요.
// 실제 보안은 Firestore 콘솔의 "규칙(rules)"이 담당합니다.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB29L0eEh4qbG4jjpa1arcUv5e0fq_O8_c",
  authDomain: "kimchapchutravel.firebaseapp.com",
  projectId: "kimchapchutravel",
  storageBucket: "kimchapchutravel.firebasestorage.app",
  messagingSenderId: "892807906937",
  appId: "1:892807906937:web:3c12322e3df2b9544b76a8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
