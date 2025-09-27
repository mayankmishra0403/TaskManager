import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBo7zGhLWr9VgDCNdsvKzNdQ0OsOpL5DpA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "taskm-1b403.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "taskm-1b403",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "taskm-1b403.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "76433987959",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:76433987959:web:e88ea1597aafff9baca972",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-K3R603N9BP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

if (typeof window !== 'undefined') {
  // Register service worker for FCM
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
        messaging = getMessaging(app);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  } else {
    console.error('Service Worker not supported in this browser');
  }
}

export { messaging };

// Request notification permission and get FCM token
export const requestPermissionAndGetToken = async () => {
  try {
    console.log('Starting FCM token request...');
    console.log('VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Present' : 'Missing');
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      return null;
    }

    // Wait for service worker to be ready
    try {
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
    } catch (swError) {
      console.error('Service worker not ready:', swError);
      return null;
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = getMessaging(app);
    }

    // Check if messaging is available
    if (!messaging) {
      console.error('Firebase messaging not initialized');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token with error handling
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          console.log('FCM Token generated successfully:', token.substring(0, 20) + '...');
          return token;
        } else {
          console.error('No registration token available. This could be due to:');
          console.error('1. Service worker registration failed');
          console.error('2. VAPID key is incorrect');
          console.error('3. Firebase configuration is incorrect');
          console.error('4. Browser doesn\'t support FCM');
          return null;
        }
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        return null;
      }
    } else {
      console.log('Unable to get permission to notify. Permission:', permission);
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        resolve(payload);
      });
    }
  });

// Debug function to test FCM setup
export const debugFCMSetup = async () => {
  console.log('=== FCM Debug Setup ===');
  console.log('1. Browser support:');
  console.log('   - serviceWorker:', 'serviceWorker' in navigator);
  console.log('   - Notification:', 'Notification' in window);
  console.log('   - PushManager:', 'PushManager' in window);
  
  console.log('2. Environment variables:');
  console.log('   - API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓' : '✗');
  console.log('   - Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗');
  console.log('   - VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✓' : '✗');
  console.log('   - VAPID Key length:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.length || 0);
  
  console.log('3. Firebase setup:');
  console.log('   - App initialized:', !!app);
  console.log('   - Messaging available:', !!messaging);
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('4. Service Worker:', registration ? '✓ Registered' : '✗ Failed');
    } catch (error) {
      console.log('4. Service Worker: ✗ Error:', error);
    }
  }
  
  console.log('=== End FCM Debug ===');
};
