import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  workspaceId: string;
  projectId?: string;
  assigneeId?: string;
  status?: string;
}

export const useGetTasks = ({ workspaceId, projectId, assigneeId, status }: UseGetTasksProps) => {
  const query = useQuery({
    queryKey: ["tasks", workspaceId, projectId, assigneeId, status],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: { 
          workspaceId,
          ...(projectId && { projectId }),
          ...(assigneeId && { assigneeId }),
          ...(status && { status }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
