import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetTask = (taskId: string) => {
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      // First get all tasks, then find the specific task
      const response = await client.api.admin.tasks.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

  const { data } = await response.json();
  const docs = (data.documents as any[] | undefined) || [];
  const task = docs.find((t: any) => t.$id === taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    },
  });

  return query;
};
