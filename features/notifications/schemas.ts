import { z } from "zod";

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["task_assigned", "admin_message", "task_update", "general"]),
  recipientIds: z.array(z.string()).min(1, "At least one recipient is required"),
  isRead: z.boolean().default(false),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  createdBy: z.string().min(1, "Creator ID is required"),
  taskId: z.string().optional(), // For task-related notifications
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const createNotificationSchema = notificationSchema.omit({
  isRead: true,
});

export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export const sendBroadcastMessageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  recipientIds: z.array(z.string()).optional(), // If empty, send to all employees
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
