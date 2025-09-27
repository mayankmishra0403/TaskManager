import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { sendPushNotification, notifyTaskAssigned, notifyAllUsers } from "../utils/send-notification";

const sendNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  allUsers: z.boolean().optional(),
});

const taskNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  taskTitle: z.string().min(1, "Task title is required"),
  assignedBy: z.string().min(1, "Assigned by is required"),
});

const app = new Hono()
  .post("/send", sessionMiddleware, zValidator("json", sendNotificationSchema), async (c) => {
    const user = c.get("user");
    const { title, message, userId, userIds, allUsers } = c.req.valid("json");

    // Only allow admins to send notifications (you can adjust this logic)
    // For now, let's allow all authenticated users for testing
    
    try {
      const result = await sendPushNotification({
        userId,
        userIds,
        allUsers,
        payload: {
          title,
          body: message,
          icon: "/icon-192x192.png",
          data: {
            type: "custom",
            sentBy: user.name || user.email
          }
        }
      });

      return c.json(result);
    } catch (error) {
      console.error("Error sending notification:", error);
      return c.json({ error: "Failed to send notification" }, 500);
    }
  })
  
  .post("/task-assigned", sessionMiddleware, zValidator("json", taskNotificationSchema), async (c) => {
    const { userId, taskTitle, assignedBy } = c.req.valid("json");

    try {
      const result = await notifyTaskAssigned(userId, taskTitle, assignedBy);
      return c.json(result);
    } catch (error) {
      console.error("Error sending task notification:", error);
      return c.json({ error: "Failed to send task notification" }, 500);
    }
  })

  .post("/announcement", sessionMiddleware, zValidator("json", z.object({
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
  })), async (c) => {
    const user = c.get("user");
    const { title, message } = c.req.valid("json");

    try {
      const result = await notifyAllUsers(title, message);
      return c.json(result);
    } catch (error) {
      console.error("Error sending announcement:", error);
      return c.json({ error: "Failed to send announcement" }, 500);
    }
  })

  .post("/test", sessionMiddleware, async (c) => {
    const user = c.get("user");
    
    try {
      // Parse body safely
      let body: any = {};
      try {
        const text = await c.req.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (parseError) {
        console.log("No body or invalid JSON, using defaults");
      }

      // For testing, send to the employee who has FCM token (Mayank Soni)
      // Instead of the admin who doesn't have a token
      const targetUserId = body.targetUserId || "68d6e0980033a5a6ec3e"; // Mayank Soni's user ID

      console.log("Test notification request:", { 
        admin: user.name || user.email,
        targetUserId,
        body 
      });

      const result = await sendPushNotification({
        userId: targetUserId,
        payload: {
          title: body.title || "Test Notification from Admin",
          body: body.body || `Test message sent by ${user.name || user.email}`,
          icon: "/icon-192x192.png",
          data: {
            type: body.type || "admin_message",
            timestamp: new Date().toISOString(),
            sentBy: user.name || user.email,
            workspaceId: "68d68fca000949a7679a" // Default workspace ID for in-app notifications
          }
        }
      });

      return c.json(result);
    } catch (error) {
      console.error("Error sending test notification:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: "Failed to send test notification", details: errorMessage }, 500);
    }
  });

export default app;
