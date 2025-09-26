import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.workspaces)["$post"]>;

type RequestType = InferRequestType<(typeof client.api.workspaces)["$post"]>;

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      // const response = await client.api.workspaces["$post"]({ form });
      // if (!response.ok) {
      //   throw new Error("Failed to create workspace");
      // }
      // return await response.json();
      try {
        const response = await client.api.workspaces["$post"]({ form });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create workspace: ${errorText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error in mutationFn:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Workspace created");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: (error) => {
      toast.error("Failed to create workspace");
    },
  });
  return mutation;
};
