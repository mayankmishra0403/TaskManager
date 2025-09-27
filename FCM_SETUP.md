# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your Task Manager application.

## Prerequisites

1. A Firebase project
2. Web app registered in Firebase
3. Firebase Cloud Messaging enabled

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

### 2. Register Your Web App

1. In your Firebase project, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "Task Manager Web")
3. Copy the Firebase config object

### 3. Enable Cloud Messaging

1. In the Firebase Console, go to "Project Settings" > "Cloud Messaging"
2. Generate a new key pair for "Web Push certificates"
3. Copy the VAPID key

### 4. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 5. Update Firebase Service Worker

Update the `public/firebase-messaging-sw.js` file with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-firebase-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 6. Create FCM Tokens Collection in Appwrite

1. Go to your Appwrite Console
2. Navigate to your database
3. Create a new collection called `fcm_tokens`
4. Add the following attributes:
   - `userId` (string, required)
   - `token` (string, required)
   - `createdAt` (string, required)
   - `updatedAt` (string, required)

### 7. Set Collection Permissions

For the `fcm_tokens` collection, set these permissions:
- **Create**: Users (authenticated users can create their own tokens)
- **Read**: Users (users can read their own tokens)
- **Update**: Users (users can update their own tokens)
- **Delete**: Users (users can delete their own tokens)

## Testing Push Notifications

### 1. Enable Notifications in the App

1. Start your development server: `npm run dev`
2. Navigate to `/settings/notifications`
3. Click "Enable Push Notifications"
4. Allow notifications when prompted by your browser

### 2. Test with Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter a notification title and text
4. In the "Target" section, select "User segment" > "All users"
5. Click "Review" and then "Publish"

### 3. Test Programmatically

You can also send notifications using the Firebase Admin SDK from your server:

```javascript
import admin from 'firebase-admin';

// Initialize Firebase Admin (server-side only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Send notification
const message = {
  notification: {
    title: 'New Task Assigned',
    body: 'You have been assigned a new task: Complete project documentation',
  },
  token: userFCMToken, // Get from your database
};

admin.messaging().send(message);
```

## Usage in Components

### Enable Notifications

```tsx
import { useFCM } from '@/hooks/use-fcm';

function NotificationButton() {
  const { initializeFCM, notificationPermission } = useFCM();

  const handleEnable = async () => {
    await initializeFCM();
  };

  return (
    <button onClick={handleEnable}>
      Enable Notifications
    </button>
  );
}
```

### Notification Settings Page

Visit `/settings/notifications` to manage push notification preferences.

## Troubleshooting

### Common Issues

1. **"Registration failed" error**: Check your VAPID key and Firebase config
2. **"Permission denied"**: User needs to allow notifications in browser settings
3. **Service worker not registering**: Check console for errors in `firebase-messaging-sw.js`
4. **Notifications not received**: Verify FCM token is saved correctly in database

### Browser Support

- Chrome 50+
- Firefox 44+
- Safari 16+ (macOS 13+)
- Edge 79+

### HTTPS Requirement

Push notifications require HTTPS in production. Make sure your deployed app uses HTTPS.

## Security Considerations

1. Keep your Firebase service account key secure
2. Validate FCM tokens on the server side
3. Implement proper user authentication before saving tokens
4. Consider token rotation and cleanup for inactive users

## Integration with Existing Notification System

The FCM implementation integrates with your existing notification system:

1. When tasks are assigned, both in-app and push notifications are sent
2. Admin broadcasts trigger both notification types
3. Users can manage preferences for each notification type separately
