import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type Options = {
  enabled?: boolean;
};

export const useGetWorkspaces = (options?: Options) => {
  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await client.api.workspaces.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch worskapces");
      }

      const { data } = await response.json();

      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return query;
};
