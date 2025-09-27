import { createAdminClient } from "@/lib/appwrite";
import { getAppwriteConfig } from "@/lib/env-config";
import { Query, ID } from "node-appwrite";

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

interface SendNotificationOptions {
  userId?: string; // Send to specific user
  userIds?: string[]; // Send to multiple users
  allUsers?: boolean; // Send to all users
  payload: NotificationPayload;
}

// Helper function to create in-app notification alongside push notification
async function createInAppNotification(
  databases: any,
  config: any,
  options: SendNotificationOptions
) {
  try {
    let targetUserIds: string[] = [];
    let workspaceId: string | undefined = options.payload.data?.workspaceId;

    if (options.allUsers) {
      // For broadcast notifications, we need to get all employees in the workspace
      if (workspaceId) {
        try {
          const employees = await databases.listDocuments(
            config.databaseId!,
            config.employeesId!,
            [Query.equal("workspaceId", workspaceId)]
          );
          targetUserIds = employees.documents.map((emp: any) => emp.userId);
        } catch (error) {
          console.error("Error fetching employees for broadcast:", error);
          return; // Skip in-app notification if we can't get recipients
        }
      } else {
        console.error("Cannot send broadcast notification without workspaceId");
        return;
      }
    } else {
      // Get specific user IDs
      if (options.userId) {
        targetUserIds = [options.userId];
      } else if (options.userIds && options.userIds.length > 0) {
        targetUserIds = options.userIds;
      }
    }

    if (targetUserIds.length === 0) {
      console.log("No target users found for in-app notification");
      return;
    }

    // Create a single notification document with recipientIds array
    await databases.createDocument(
      config.databaseId!,
      config.notificationsId!,
      ID.unique(),
      {
        title: options.payload.title,
        message: options.payload.body,
        type: options.payload.data?.type || "general",
        priority: options.payload.data?.priority || "medium",
        recipientIds: JSON.stringify(targetUserIds), // Store as JSON string
        isRead: false,
        workspaceId: workspaceId || "default", // Use provided workspaceId or fallback
        createdBy: options.payload.data?.sentBy || "admin",
        taskId: options.payload.data?.taskId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`✅ Created in-app notification for ${targetUserIds.length} users`);
  } catch (error) {
    console.error("Error creating in-app notification:", error);
    // Don't throw - in-app notification failure shouldn't prevent push notification
  }
}

export async function sendPushNotification(options: SendNotificationOptions) {
  try {
    const { databases, messaging } = await createAdminClient();
    const config = getAppwriteConfig();

    console.log("Sending push notification via Appwrite messaging:", options);

    // Create in-app notification first
    await createInAppNotification(databases, config, options);

    // Prepare message data for Appwrite
    const messageData = {
      title: options.payload.title,
      body: options.payload.body,
      icon: options.payload.icon || '/icon-192x192.png',
      ...options.payload.data
    };

    if (options.allUsers) {
      // Send to all users - Appwrite will handle FCM tokens automatically
      try {
        const message = await messaging.createPush(
          ID.unique(),
          options.payload.title,
          options.payload.body,
          undefined, // topics - leave undefined to send to all subscribed users
          undefined, // users - leave undefined for all users
          undefined, // targets
          messageData, // data payload
          undefined, // action
          options.payload.icon
        );

        console.log("Message sent to all users:", message.$id);

        return {
          success: true,
          message: "Push notification and in-app notification sent to all users",
          details: { messageId: message.$id }
        };
      } catch (messagingError) {
        console.error("Appwrite messaging error for all users:", messagingError);
        return await sendDirectFCMNotification(options, databases, config);
      }
    } 
    
    // Send to specific users
    let targetUserIds: string[] = [];
    if (options.userId) {
      targetUserIds = [options.userId];
    } else if (options.userIds && options.userIds.length > 0) {
      targetUserIds = options.userIds;
    }

    if (targetUserIds.length > 0) {
      try {
        const message = await messaging.createPush(
          ID.unique(),
          options.payload.title,
          options.payload.body,
          undefined, // topics
          targetUserIds, // specific users
          undefined, // targets
          messageData, // data payload
          undefined, // action
          options.payload.icon
        );

        console.log(`Message sent to ${targetUserIds.length} users:`, message.$id);

        return {
          success: true,
          message: `Push notification and in-app notification sent to ${targetUserIds.length} users`,
          details: { messageId: message.$id, userCount: targetUserIds.length }
        };
      } catch (messagingError) {
        console.error("Appwrite messaging error for specific users:", messagingError);
        return await sendDirectFCMNotification(options, databases, config);
      }
    }

    return { success: false, message: "No valid targets specified" };

  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, message: "Failed to send notification" };
  }
}

// Fallback function using Firebase Admin SDK
async function sendDirectFCMNotification(options: SendNotificationOptions, databases: any, config: any) {
  console.log("🔍 Firebase Admin FCM Debug - Options:", JSON.stringify(options, null, 2));
  
  // Get FCM tokens based on options
  let tokens: string[] = [];

  if (options.allUsers) {
    console.log("📡 Getting all FCM tokens...");
    // Get all FCM tokens
    const allTokens = await databases.listDocuments(
      config.databaseId!,
      process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!
    );
    console.log(`📊 Found ${allTokens.total} total tokens`);
    tokens = allTokens.documents.map((doc: any) => doc.token);
  } else if (options.userId) {
    console.log(`🎯 Getting FCM token for user: ${options.userId}`);
    // Get token for specific user
    const userTokens = await databases.listDocuments(
      config.databaseId!,
      process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
      [Query.equal("userId", options.userId)]
    );
    console.log(`📊 Found ${userTokens.total} tokens for user ${options.userId}`);
    tokens = userTokens.documents.map((doc: any) => doc.token);
  } else if (options.userIds && options.userIds.length > 0) {
    console.log(`🎯 Getting FCM tokens for ${options.userIds.length} users:`, options.userIds);
    // Get tokens for multiple users - fix the query to use OR condition
    const queries = options.userIds.map(userId => Query.equal("userId", userId));
    const multiUserTokens = await databases.listDocuments(
      config.databaseId!,
      process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
      queries
    );
    console.log(`📊 Found ${multiUserTokens.total} tokens for ${options.userIds.length} users`);
    tokens = multiUserTokens.documents.map((doc: any) => doc.token);
  }

  console.log(`🔢 Total tokens to send to: ${tokens.length}`);
  
  if (tokens.length === 0) {
    console.log("❌ No FCM tokens found for the specified users");
    console.log("🔍 Debug info:");
    console.log("   - Database ID:", config.databaseId);
    console.log("   - FCM Collection ID:", process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID);
    console.log("   - Target options:", { userId: options.userId, userIds: options.userIds, allUsers: options.allUsers });
    return { success: false, message: "No tokens found" };
  }

  // Use Firebase Admin SDK for better reliability
  try {
    const { sendFCMNotificationAdmin } = await import('@/lib/firebase-admin');
    
    const result = await sendFCMNotificationAdmin(tokens, {
      title: options.payload.title,
      body: options.payload.body,
      icon: options.payload.icon,
      data: options.payload.data ? Object.fromEntries(
        Object.entries(options.payload.data).map(([k, v]) => [k, String(v)])
      ) : {}
    });

    return {
      success: result.success,
      message: `Firebase Admin: ${result.successCount} sent, ${result.failureCount} failed`,
      details: { 
        successful: result.successCount, 
        failed: result.failureCount, 
        total: tokens.length 
      }
    };
  } catch (adminError) {
    console.error("❌ Firebase Admin SDK failed, falling back to direct FCM:", adminError);
    
    // Fallback to direct FCM if Firebase Admin fails
    const results = await Promise.allSettled(
      tokens.map(token => sendFCMMessage(token, options.payload))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: successful > 0,
      message: `Fallback Direct FCM: ${successful} sent, ${failed} failed`,
      details: { successful, failed, total: tokens.length }
    };
  }
}

async function sendFCMMessage(token: string, payload: NotificationPayload) {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  
  if (!serverKey) {
    throw new Error("Firebase server key not configured");
  }

  const message = {
    to: token,
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
    },
    data: payload.data || {},
    webpush: {
      headers: {
        Urgency: "high"
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192x192.png",
        badge: payload.badge || "/icon-192x192.png",
        requireInteraction: true,
        tag: "task-notification"
      }
    }
  };

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Authorization": `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FCM request failed: ${error}`);
  }

  return await response.json();
}

// Helper functions for common notifications
export async function notifyTaskAssigned(userId: string, taskTitle: string, assignedBy: string, workspaceId?: string) {
  return sendPushNotification({
    userId,
    payload: {
      title: "New Task Assigned",
      body: `${assignedBy} assigned you "${taskTitle}"`,
      icon: "/icon-192x192.png",
      data: {
        type: "task_assigned",
        priority: "high",
        taskTitle,
        assignedBy,
        workspaceId,
        url: "/my-tasks"
      }
    }
  });
}

export async function notifyTaskCompleted(userId: string, taskTitle: string, completedBy: string, workspaceId?: string) {
  return sendPushNotification({
    userId,
    payload: {
      title: "Task Completed",
      body: `${completedBy} completed "${taskTitle}"`,
      icon: "/icon-192x192.png",
      data: {
        type: "task_completed",
        priority: "medium",
        taskTitle,
        completedBy,
        workspaceId,
        url: "/admin/tasks"
      }
    }
  });
}

export async function notifyTaskUpdate(userId: string, taskTitle: string, updateType: string, updatedBy: string, workspaceId?: string) {
  return sendPushNotification({
    userId,
    payload: {
      title: "Task Updated",
      body: `${updatedBy} ${updateType} "${taskTitle}"`,
      icon: "/icon-192x192.png",
      data: {
        type: "task_update",
        priority: "medium",
        taskTitle,
        updateType,
        updatedBy,
        workspaceId,
        url: "/my-tasks"
      }
    }
  });
}

export async function notifyAllUsers(title: string, message: string, priority: string = "medium") {
  return sendPushNotification({
    allUsers: true,
    payload: {
      title,
      body: message,
      icon: "/icon-192x192.png",
      data: {
        type: "admin_message",
        priority,
        url: "/",
        workspaceId: "68d68fca000949a7679a", // Default workspace ID for in-app notifications
        sentBy: "Admin"
      }
    }
  });
}

export async function notifyAdminMessage(userId: string, title: string, message: string, workspaceId?: string) {
  return sendPushNotification({
    userId,
    payload: {
      title,
      body: message,
      icon: "/icon-192x192.png",
      data: {
        type: "admin_message",
        priority: "high",
        workspaceId,
        url: "/"
      }
    }
  });
}
