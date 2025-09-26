import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetAllProjects = () => {
  const query = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const response = await client.api.admin.projects.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch all projects");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
