import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetEmployeesProps {
  workspaceId: string;
}

export const useGetEmployees = ({ workspaceId }: UseGetEmployeesProps) => {
  const query = useQuery({
    queryKey: ["employees", workspaceId],
    queryFn: async () => {
      const response = await client.api.employees.$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
