import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.employees)[":employeeId"]["$delete"]>;
type RequestType = InferRequestType<(typeof client.api.employees)[":employeeId"]["$delete"]>;

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const res = await client.api.employees[":employeeId"]["$delete"]({ param });
      if (!res.ok) throw new Error("Failed to delete employee");
      return await res.json();
    },
    onSuccess: () => {
      toast.success("Employee deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "employees", "list"] });
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  return mutation;
};
