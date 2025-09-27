import { z } from "zod";
import { notificationSchema, createNotificationSchema, markAsReadSchema, sendBroadcastMessageSchema } from "./schemas";

export type Notification = z.infer<typeof notificationSchema> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

export type CreateNotification = z.infer<typeof createNotificationSchema>;

export type MarkAsRead = z.infer<typeof markAsReadSchema>;

export type SendBroadcastMessage = z.infer<typeof sendBroadcastMessageSchema>;

export type NotificationType = "task_assigned" | "admin_message" | "task_update" | "general";

export type NotificationPriority = "low" | "medium" | "high";
