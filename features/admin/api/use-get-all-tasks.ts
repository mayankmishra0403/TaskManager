import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetAllTasksOptions {
  enabled?: boolean;
}

export const useGetAllTasks = (options: UseGetAllTasksOptions = {}) => {
  const query = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: async () => {
      const response = await client.api.admin.tasks.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch all tasks");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: options.enabled !== false,
  });

  return query;
};
