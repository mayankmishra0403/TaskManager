import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

// Types for API responses
type NotificationsResponse = InferResponseType<typeof client.api.notifications["$get"]>;
type UnreadCountResponse = InferResponseType<typeof client.api.notifications["unread-count"]["$get"]>;
type ManageNotificationsResponse = InferResponseType<typeof client.api.notifications["manage"]["$get"]>;
type CreateNotificationRequest = InferRequestType<typeof client.api.notifications["$post"]>;
type BroadcastMessageRequest = InferRequestType<typeof client.api.notifications.broadcast["$post"]>;
type MarkAsReadRequest = InferRequestType<typeof client.api.notifications["mark-read"]["$patch"]>;

// Get all notifications for current user in workspace
export const useGetNotifications = (workspaceId?: string) => {
  return useQuery({
    queryKey: ["notifications", workspaceId || "all"],
    queryFn: async () => {
      const response = await client.api.notifications.$get(
        workspaceId ? { query: { workspaceId } } : {}
      );

      if (!response.ok) {
  let body: any = undefined;
  try { body = await response.clone().json(); } catch {}
  console.error("Notifications fetch failed:", response.status, body);
  throw new Error("Failed to fetch notifications");
      }

      const { data } = await response.json();
      return data;
    },
    // Always enabled; server will handle optional workspaceId
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 4000,
  });
};

// Get unread notifications count
export const useGetUnreadCount = (workspaceId: string) => {
  return useQuery({
    queryKey: ["notifications", "unread-count", workspaceId],
    queryFn: async () => {
      const response = await client.api.notifications["unread-count"].$get(
        workspaceId ? { query: { workspaceId } } : {}
      );

      if (!response.ok) {
  let body: any = undefined;
  try { body = await response.clone().json(); } catch {}
  console.error("Unread count fetch failed:", response.status, body);
  throw new Error("Failed to fetch unread count");
      }

      const { data } = await response.json();
      return data;
    },
  enabled: !!workspaceId,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 4000,
  });
};

// Get admin/broadcast notifications for admin management view
export const useGetManageNotifications = (workspaceId: string) => {
  return useQuery<ManageNotificationsResponse | any>({
    queryKey: ["notifications", "manage", workspaceId],
    queryFn: async () => {
      const response = await client.api.notifications["manage"].$get({
        query: { workspaceId }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workspace notifications");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
};

// Create notification (for task assignments)
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: CreateNotificationRequest["json"]) => {
      const response = await client.api.notifications.$post({ json });
      
      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send notification");
      console.error("Create notification error:", error);
    },
  });
};

// Send broadcast message
export const useSendBroadcastMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: BroadcastMessageRequest["json"]) => {
      const response = await client.api.notifications.broadcast.$post({ json });
      
      if (!response.ok) {
        throw new Error("Failed to send broadcast message");
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Broadcast message sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send broadcast message");
      console.error("Broadcast message error:", error);
    },
  });
};

// Mark notifications as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: MarkAsReadRequest["json"]) => {
      const response = await client.api.notifications["mark-read"].$patch({ json });
      
      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error("Failed to mark notifications as read");
      console.error("Mark as read error:", error);
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await client.api.notifications[":notificationId"].$delete({
        param: { notificationId }
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete notification");
      console.error("Delete notification error:", error);
    },
  });
};
