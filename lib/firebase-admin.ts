import admin from 'firebase-admin';

// Firebase Admin SDK configuration
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@taskm-1b403.iam.gserviceaccount.com',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin SDK (singleton pattern)
let firebaseAdmin: admin.app.App;

export function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      // Check if already initialized
      firebaseAdmin = admin.app();
    } catch (error) {
      // Initialize if not already done
      if (firebaseAdminConfig.privateKey) {
        // Use environment variables (recommended for production)
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseAdminConfig.projectId,
            clientEmail: firebaseAdminConfig.clientEmail,
            privateKey: firebaseAdminConfig.privateKey,
          }),
          projectId: firebaseAdminConfig.projectId,
        });
        console.log('✅ Firebase Admin SDK initialized with environment variables');
      } else {
        console.error('❌ Firebase Admin SDK configuration missing');
        console.error('Please set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID environment variables');
        throw new Error('Firebase Admin SDK configuration missing');
      }
    }
  }
  return firebaseAdmin;
}

// Send FCM notification using Firebase Admin SDK
export async function sendFCMNotificationAdmin(tokens: string[], payload: {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}) {
  try {
    const admin = getFirebaseAdmin();
    const messaging = admin.messaging();

    // Convert relative paths to full URLs
    const fullIconUrl = payload.icon?.startsWith('http') 
      ? payload.icon 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${payload.icon || '/icon-192x192.png'}`;

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        // Only set imageUrl if we have a full URL
        ...(fullIconUrl ? { imageUrl: fullIconUrl } : {}),
      },
      data: payload.data || {},
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: fullIconUrl,
          badge: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/icon-192x192.png`,
          requireInteraction: true,
          tag: 'task-notification',
          actions: [
            {
              action: 'open',
              title: 'Open App',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
            },
          ],
        },
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      },
      tokens: tokens,
    };

    console.log(`🚀 Sending FCM notification to ${tokens.length} tokens using Firebase Admin SDK`);
    
    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`📊 FCM Results: ${response.successCount} successful, ${response.failureCount} failed`);
    
    if (response.failureCount > 0) {
      console.error('❌ FCM Failures:', response.responses
        .map((resp: any, idx: number) => resp.success ? null : { token: tokens[idx], error: resp.error })
        .filter(Boolean)
      );
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      results: response.responses,
    };

  } catch (error) {
    console.error('❌ Firebase Admin FCM Error:', error);
    throw error;
  }
}

// Send to single token
export async function sendFCMNotificationToToken(token: string, payload: {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}) {
  return sendFCMNotificationAdmin([token], payload);
}

// Test Firebase Admin connection
export async function testFirebaseAdminConnection() {
  try {
    const admin = getFirebaseAdmin();
    const messaging = admin.messaging();
    
    // Test by attempting to send a dry-run message
    const testMessage = {
      notification: {
        title: 'Test',
        body: 'Connection test',
      },
      token: 'test-token-that-will-fail', // This will fail but validates the connection
      dryRun: true,
    };

    try {
      await messaging.send(testMessage);
    } catch (testError: any) {
      // Expected to fail with invalid token, but validates connection
      if (testError.code === 'messaging/invalid-registration-token') {
        console.log('✅ Firebase Admin SDK connection is working');
        return { success: true, message: 'Connection validated' };
      }
      throw testError;
    }

    return { success: true, message: 'Connection validated' };
  } catch (error) {
    console.error('❌ Firebase Admin connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
