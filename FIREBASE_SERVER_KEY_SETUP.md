# Firebase Server Key Setup

To complete the push notification setup, you need to get your Firebase Server Key from the Firebase Console.

## Steps to get Firebase Server Key:

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `taskm-1b403`

2. **Navigate to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

3. **Go to Cloud Messaging Tab**
   - Click on the "Cloud Messaging" tab
   - Look for "Server key" in the "Project credentials" section

4. **Copy the Server Key**
   - Copy the server key (it starts with `AAAA...`)

5. **Update your .env.local file**
   - Replace `your_firebase_server_key_here` with your actual server key:
   ```bash
   FIREBASE_SERVER_KEY=AAAA...your_actual_server_key
   ```

## Alternative: Using Firebase Admin SDK (Recommended)

For better security, you can also use Firebase Admin SDK with a service account:

1. **Create Service Account**
   - In Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to your environment**
   ```bash
   FIREBASE_ADMIN_SDK_CONFIG={"type":"service_account",...} # paste the entire JSON content
   ```

## Testing Push Notifications

Once configured, you can test push notifications:

1. **Login to your admin panel**: `/admin/notifications`
2. **Enable notifications** in your browser when prompted
3. **Send a test notification**
4. **Try sending notifications to specific users or all users**

## Features Available:

✅ **User Notification Settings**: `/settings/notifications`
- Enable/disable push notifications
- View current FCM token
- Test notifications

✅ **Admin Notification Panel**: `/admin/notifications`
- Send custom notifications
- Send announcements to all users
- Send test notifications
- Task assignment notifications (automated)

✅ **API Endpoints**:
- `POST /api/fcm/save-token` - Save user's FCM token
- `POST /api/fcm/remove-token` - Remove user's FCM token
- `POST /api/fcm/notifications/send` - Send custom notification
- `POST /api/fcm/notifications/test` - Send test notification
- `POST /api/fcm/notifications/announcement` - Send announcement
- `POST /api/fcm/notifications/task-assigned` - Task assignment notification

## Database

✅ **Appwrite Collection Created**: `fcm_tokens` (ID: 68d7cad30037f5e50c28)
- Stores user FCM tokens
- Handles token updates and removals
- Indexed for quick user lookups

Your FCM implementation is now complete and ready for production use!
