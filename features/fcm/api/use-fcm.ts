import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export const useSaveFCMToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await client.api.fcm["save-token"].$post({
        json: { token }
      });
      
      if (!response.ok) {
        throw new Error("Failed to save FCM token");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fcm-token"] });
      toast.success("Push notification token saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save push notification token");
      console.error("Save FCM token error:", error);
    },
  });
};

export const useRemoveFCMToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.fcm["remove-token"].$delete();
      
      if (!response.ok) {
        throw new Error("Failed to remove FCM token");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fcm-token"] });
      toast.success("Push notification token removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove push notification token");
      console.error("Remove FCM token error:", error);
    },
  });
};
