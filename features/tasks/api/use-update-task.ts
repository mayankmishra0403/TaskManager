import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { TaskStatus, TaskPriority } from "../schemas";

interface UpdateTaskData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  projectId?: string;
  position?: number;
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      const response = await client.api.tasks[":taskId"]["$patch"]({ 
        param: { taskId }, 
        json: data 
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      
      return await response.json();
    },  
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
  
  return mutation;
};
