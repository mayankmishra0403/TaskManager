import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetEmployeeTasksOptions {
  enabled?: boolean;
}

export const useGetEmployeeTasks = (options: UseGetEmployeeTasksOptions = {}) => {
  const query = useQuery({
    queryKey: ["employee", "tasks"],
    queryFn: async () => {
      const response = await client.api.tasks["my-tasks"].$get();

      if (!response.ok) {
        throw new Error("Failed to fetch employee tasks");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: options.enabled !== false,
  });

  return query;
};
