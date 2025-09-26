import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetAllEmployees = () => {
  const query = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async () => {
      const response = await client.api.admin.employees.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch all employees");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
