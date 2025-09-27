import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { getAppwriteConfig } from "@/lib/env-config";

import { 
  createNotificationSchema, 
  markAsReadSchema, 
  sendBroadcastMessageSchema 
} from "../schemas";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const workspaceId = c.req.query("workspaceId");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Resolve current user's employee document ID (if any), to support legacy notifications
      let employeeIdForUser: string | null = null;
      try {
        const empRes = await databases.listDocuments(
          config.databaseId!,
          config.employeesId!,
          [Query.equal("userId", user.$id), Query.limit(1)]
        );
        if (empRes.total > 0) employeeIdForUser = empRes.documents[0].$id;
      } catch (e) {
        console.warn("Notifications list: failed to resolve employeeId for user", user.$id, e);
      }

  // Fetch a large recent window across all workspaces; we'll filter per type below.
  // We don't strictly filter by workspace here so that task_assigned notifications are visible
  // to recipients even if their current UI workspace context differs.
  const query: any[] = [Query.orderDesc("$createdAt"), Query.limit(1000)];

  const res = await databases.listDocuments(
        config.databaseId!,
        "notifications",
        query
      );

      console.log("Fetching notifications for user:", user.$id);
      console.log("Total documents found:", res.documents.length);
      
  const docs = res.documents.filter((doc: any) => {
    // Admin broadcasts: restrict by workspace when provided
    if (doc.type === 'admin_message') {
          if (workspaceId && doc.workspaceId && doc.workspaceId !== workspaceId) return false;
          return true;
        }
        const raw: any = doc.recipientIds as any;
        console.log("Document:", doc.$id, "recipientIds(type,value):", typeof raw, raw);
        if (!raw) return false;

        // Case 1: Already an array
        if (Array.isArray(raw)) {
          const isIncluded = raw.includes(user.$id) || (!!employeeIdForUser && raw.includes(employeeIdForUser));
          console.log("Array recipientIds includes user:", isIncluded);
  return isIncluded || doc.type === 'admin_message';
        }

        // Case 2: JSON string
        if (typeof raw === 'string') {
          try {
            const ids = JSON.parse(raw);
            const isIncluded = Array.isArray(ids) && (ids.includes(user.$id) || (!!employeeIdForUser && ids.includes(employeeIdForUser)));
            console.log("Parsed IDs:", ids, "User included:", isIncluded);
            if (isIncluded) return true;
          } catch {}

          // Case 3: plain delimited/string content fallback
          const isIncluded = raw.includes?.(user.$id) || (!!employeeIdForUser && raw.includes?.(employeeIdForUser));
          console.log("String includes fallback, user included:", !!isIncluded);
          return !!isIncluded || doc.type === 'admin_message';
        }

        return false;
      });
      
      console.log("Filtered documents count:", docs.length);

  return c.json({ data: docs });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return c.json({ error: "Failed to fetch notifications" }, 500);
    }
  })
  // Admin: list broadcast/admin notifications for a workspace
  .get("/manage", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const workspaceId = c.req.query("workspaceId");

    if (!workspaceId) {
      return c.json({ error: "Workspace ID is required" }, 400);
    }

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Admin check via labels/email
      const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";
      if (!isAdmin) {
        return c.json({ error: "Only admins can manage notifications" }, 403);
      }

      const res = await databases.listDocuments(
        config.databaseId!,
        "notifications",
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("type", "admin_message"),
          Query.orderDesc("$createdAt"),
          Query.limit(200)
        ]
      );

      return c.json({ data: res.documents });
    } catch (error) {
      console.error("Failed to fetch workspace notifications:", error);
      return c.json({ error: "Failed to fetch workspace notifications" }, 500);
    }
  })
  .get("/unread-count", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const workspaceId = c.req.query("workspaceId");

    console.log("Unread count - user:", user.$id);
    console.log("Unread count - workspaceId:", workspaceId);

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Resolve employee ID for current user
      let employeeIdForUser: string | null = null;
      try {
        const empRes = await databases.listDocuments(
          config.databaseId!,
          config.employeesId!,
          [Query.equal("userId", user.$id), Query.limit(1)]
        );
        if (empRes.total > 0) employeeIdForUser = empRes.documents[0].$id;
      } catch (e) {
        console.warn("Unread-count: failed to resolve employeeId for user", user.$id, e);
      }

  // Align with list route: fetch across all and filter per type below
  const query: any[] = [Query.orderDesc("$createdAt"), Query.limit(1000)];

      console.log("Unread count - Fetching notifications with query:", query);
      const res = await databases.listDocuments(
        config.databaseId!,
        "notifications",
        query
      );

      // Filter by recipient and unread flag
      console.log("Unread count check for user:", user.$id);
      console.log("Total notifications to check:", res.documents.length);
      
      const count = res.documents.reduce((acc: number, doc: any) => {
        // Log document details to help with debugging
        console.log("Checking notification:", {
          id: doc.$id,
          title: doc.title,
          type: doc.type,
          isRead: doc.isRead,
          recipientIds: doc.recipientIds
        });
        
  const raw: any = doc.recipientIds as any;
        let includesUser = false;

  // Broadcast-like types apply to all users in the (filtered) workspace
  if (doc.type === 'admin_message') {
    // Only count admin messages within the selected workspace (if any)
    includesUser = workspaceId ? doc.workspaceId === workspaceId : true;
  }

        if (!includesUser) {
          if (!raw) {
            console.log("No recipientIds found for doc:", doc.$id);
            return acc;
          }
        }
        
        if (Array.isArray(raw)) {
          includesUser = raw.includes(user.$id) || (!!employeeIdForUser && raw.includes(employeeIdForUser));
        } else if (typeof raw === 'string') {
          try {
            const ids = JSON.parse(raw);
            includesUser = Array.isArray(ids) && (ids.includes(user.$id) || (!!employeeIdForUser && ids.includes(employeeIdForUser)));
            console.log("Parsed recipientIds:", ids);
          } catch (e) {
            console.log("Failed to parse recipientIds, trying string match");
            includesUser = raw.includes(user.$id) || (!!employeeIdForUser && raw.includes(employeeIdForUser));
          }
        }
        
        const isUnread = doc.isRead === false;
        console.log("Doc:", doc.$id, "includes user:", includesUser, "isUnread:", isUnread);
        
        if (includesUser && isUnread) {
          console.log("✅ Counting as unread notification");
          return acc + 1;
        }
        return acc;
      }, 0);
      
      console.log("Final unread count:", count);

      return c.json({ data: { count } });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      return c.json({ error: "Failed to fetch unread count" }, 500);
    }
  })
  .post("/", sessionMiddleware, zValidator("json", createNotificationSchema), async (c) => {
    const user = c.get("user");
    const { title, message, type, recipientIds, workspaceId, taskId, priority } = c.req.valid("json");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Check if user is admin (for admin_message type)
      if (type === "admin_message") {
        const employee = await databases.getDocument(
          config.databaseId!,
          config.employeesId!,
          user.$id
        );

        if (employee.role !== "admin") {
          return c.json({ error: "Only admins can send admin messages" }, 403);
        }
      }

      // Create notification
    const notification = await databases.createDocument(
        config.databaseId!,
        "notifications",
        ID.unique(),
        {
          title,
          message,
          type,
      recipientIds: JSON.stringify(recipientIds),
          workspaceId,
          createdBy: user.$id,
          taskId,
          priority,
          isRead: false,
        }
      );

      return c.json({ data: notification });
    } catch (error) {
      console.error("Failed to create notification:", error);
      return c.json({ error: "Failed to create notification" }, 500);
    }
  })
  .post("/broadcast", sessionMiddleware, zValidator("json", sendBroadcastMessageSchema), async (c) => {
    const user = c.get("user");
    const { title, message, workspaceId, recipientIds, priority } = c.req.valid("json");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Check if user is admin
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
      if (!isAdmin) {
        return c.json({ error: "Only admins can send broadcast messages" }, 403);
      }

      let finalRecipientIds = recipientIds;

      // If no specific recipients, send to all employees in workspace
      if (!recipientIds || recipientIds.length === 0) {
        console.log("Fetching employees for workspaceId:", workspaceId);
        console.log("Using databaseId:", config.databaseId);
        console.log("Using employeesId:", config.employeesId);
        
        const employees = await databases.listDocuments(
          config.databaseId!,
          config.employeesId!,
          [
            Query.equal("workspaceId", workspaceId),
            Query.limit(1000)
          ]
        );
        
        console.log("Found employees:", employees.documents.length);
        finalRecipientIds = employees.documents.map(emp => emp.userId);
      }

    // Create broadcast notification
      console.log("Creating notification with data:", {
        title,
        message,
        type: "admin_message",
        recipientIds: finalRecipientIds,
        workspaceId,
        createdBy: user.$id,
        priority,
        isRead: false,
      });
      
      const notification = await databases.createDocument(
        config.databaseId!,
        "notifications",
        ID.unique(),
        {
          title,
          message,
          type: "admin_message",
      recipientIds: JSON.stringify(finalRecipientIds),
          workspaceId,
          createdBy: user.$id,
          priority,
          isRead: false,
        }
      );

      return c.json({ data: notification });
    } catch (error) {
      console.error("Failed to send broadcast message:", error);
      return c.json({ error: "Failed to send broadcast message" }, 500);
    }
  })
  .patch("/mark-read", sessionMiddleware, zValidator("json", markAsReadSchema), async (c) => {
    const user = c.get("user");
    const { notificationIds } = c.req.valid("json");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Resolve employee ID for current user
      let employeeIdForUser: string | null = null;
      try {
        const empRes = await databases.listDocuments(
          config.databaseId!,
          config.employeesId!,
          [Query.equal("userId", user.$id), Query.limit(1)]
        );
        if (empRes.total > 0) employeeIdForUser = empRes.documents[0].$id;
      } catch (e) {
        console.warn("Mark-read: failed to resolve employeeId for user", user.$id, e);
      }

      // Mark notifications as read (allow for broadcasts)
      const updatePromises = notificationIds.map(async (id) => {
    const doc = await databases.getDocument(config.databaseId!, "notifications", id);
    const raw = doc.recipientIds as string | undefined;
        let includesUser = false;
  if (doc.type === 'admin_message') {
          includesUser = true;
        } else {
          try {
      const ids = JSON.parse(raw || "[]");
      includesUser = Array.isArray(ids) && (ids.includes(user.$id) || (!!employeeIdForUser && ids.includes(employeeIdForUser)));
          } catch {
      includesUser = (typeof raw === 'string' && (raw.includes(user.$id) || (!!employeeIdForUser && raw.includes(employeeIdForUser))));
          }
        }
        if (!includesUser) return null;
        return databases.updateDocument(config.databaseId!, "notifications", id, { isRead: true });
      });

      await Promise.all(updatePromises);

      return c.json({ data: { success: true } });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      return c.json({ error: "Failed to mark notifications as read" }, 500);
    }
  })
  .delete("/:notificationId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const notificationId = c.req.param("notificationId");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Admins only can delete any notification
      const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";
      if (!isAdmin) {
        return c.json({ error: "Only admins can delete notifications" }, 403);
      }

      // Ensure document exists then delete
      await databases.getDocument(config.databaseId!, "notifications", notificationId);
      await databases.deleteDocument(config.databaseId!, "notifications", notificationId);

      return c.json({ data: { success: true } });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      return c.json({ error: "Failed to delete notification" }, 500);
    }
  });

export default app;
