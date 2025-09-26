import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.employees)["$post"]>;
type RequestType = InferRequestType<(typeof client.api.employees)["$post"]>;

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.employees["$post"]({ json });
      
      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error || "Failed to create employee");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Employee created successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });
  
  return mutation;
};
