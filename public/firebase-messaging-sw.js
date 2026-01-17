importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Replace these values with your Firebase config at build/deploy time.
const firebaseConfig = {
  apiKey: 'AIzaSyDmUnuHlGm9FEsFs8AFRuJsOw8tSaBHMQ0',
  authDomain: 'apex-app-main.firebaseapp.com',
  projectId: 'apex-app-main',
  storageBucket: 'apex-app-main.firebasestorage.app',
  messagingSenderId: '898623854898',
  appId: '1:898623854898:web:4998990b82d937977edf2b',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Apex';
  const options = {
    body: payload?.notification?.body || '',
    data: payload?.data || {},
  };

  self.registration.showNotification(title, options);
});
