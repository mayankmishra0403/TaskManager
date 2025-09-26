import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetCurrentEmployeeOptions {
  enabled?: boolean;
}

export const useGetCurrentEmployee = (options: UseGetCurrentEmployeeOptions = {}) => {
  const query = useQuery({
    queryKey: ["current-employee"],
    queryFn: async () => {
      const response = await client.api.employees.current.$get();

      if (!response.ok) {
        if (response.status === 404) {
          // Employee record not found - return null instead of throwing
          return null;
        }
        throw new Error("Failed to fetch current employee");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: options.enabled !== false,
  });

  return query;
};
