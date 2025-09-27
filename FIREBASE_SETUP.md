# Firebase Setup Instructions

## Firebase Service Account Setup

1. **Download your Firebase service account key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `firebase-service-account.json` in the project root

2. **Configure environment variables:**
   ```bash
   # Firebase Admin SDK Configuration (for server-side FCM)
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   FIREBASE_PROJECT_ID=your-project-id
   ```

3. **Alternative: Use the JSON file directly**
   - Copy `firebase-service-account.sample.json` to `firebase-service-account.json`
   - Fill in your actual Firebase credentials
   - The file is already in `.gitignore` for security

## Security Note

⚠️ **Never commit actual Firebase credentials to version control!**

The `firebase-service-account.json` file contains sensitive credentials and is excluded from git via `.gitignore`. Always use environment variables or secure credential management in production.

## Firebase Console Setup

1. Enable Firebase Cloud Messaging (FCM) in your Firebase project
2. Configure your web app push notification settings
3. Generate a VAPID key for web push notifications
4. Add your domain to authorized domains

## Testing

After setup, you can test notifications using:
- Admin notification panel: `/admin/notifications`
- FCM test page: `/fcm-test` (development only)
- Employee settings: `/settings/notifications`
