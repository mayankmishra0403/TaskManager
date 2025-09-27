# 🔑 VAPID Key Setup Guide

You need to get a VAPID key from Firebase to complete the FCM setup. Here's how:

## Step 1: Get VAPID Key from Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `taskm-1b403`
3. **Navigate to Project Settings**:
   - Click the gear icon ⚙️ in the left sidebar
   - Select "Project settings"
4. **Go to Cloud Messaging tab**:
   - Click on the "Cloud Messaging" tab
5. **Generate Web Push Certificate**:
   - Scroll down to "Web Push certificates"
   - Click "Generate key pair" if you don't have one
   - Copy the VAPID key

## Step 2: Update Environment Variable

Replace `YOUR_VAPID_KEY_HERE` in your `.env.local` file with the actual key:

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Create FCM Tokens Collection in Appwrite

1. **Go to Appwrite Console**: https://fra.cloud.appwrite.io/
2. **Navigate to your database**: `68d500f40016e65b5da6`
3. **Create new collection**:
   - Name: `fcm_tokens`
   - Collection ID: `fcm_tokens` (or auto-generate)

4. **Add attributes**:
   ```
   - userId (String, required, size: 255)
   - token (String, required, size: 1000)
   - createdAt (String, required, size: 50)
   - updatedAt (String, required, size: 50)
   ```

5. **Set permissions**:
   - Create: Users (any authenticated user)
   - Read: Users (users can read their own documents)
   - Update: Users (users can update their own documents) 
   - Delete: Users (users can delete their own documents)

## Step 4: Test the Setup

1. **Start your dev server**: `npm run dev`
2. **Visit**: http://localhost:3000/settings/notifications
3. **Click**: "Enable Push Notifications"
4. **Allow** notifications when prompted
5. **Test**: Click "Test Notification"

## Step 5: Send Test Notification from Firebase

1. **Go to Firebase Console** > Cloud Messaging
2. **Click** "Send your first message"
3. **Fill in**:
   - Notification title: "Test from Firebase"
   - Notification text: "This is a test notification"
4. **Select target**: "All users" or specific tokens
5. **Click** "Review" then "Publish"

## 🎯 Your Current Firebase Config:
```javascript
Project ID: taskm-1b403
App ID: 1:76433987959:web:e88ea1597aafff9baca972
Messaging Sender ID: 76433987959
```

Once you complete these steps, your push notifications will be fully functional! 🚀
