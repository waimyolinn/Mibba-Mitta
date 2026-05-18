importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIz*****YM",
  authDomain: "mibamyitta-8e457.firebaseapp.com",
  projectId: "mibamyitta-8e457",
  storageBucket: "mibamyitta-8e457.firebasestorage.app",
  messagingSenderId: "543668158288",
  appId: "1:543668158288:web:3ae1d66d9b2889fd2bb655",
  measurementId: "G-V82T3KWCVK"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);
  const notificationTitle = payload.notification?.title || "Mi Ba Mitta";
  const notificationOptions = {
    body: payload.notification?.body || "အကြောင်းအရာအသစ်ရှိပါသည်။",
    icon: "/favicon.ico"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});