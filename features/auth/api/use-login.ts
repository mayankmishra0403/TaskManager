import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>;

type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>;

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.login["$post"]({ json });
      if (!response.ok) {
        throw new Error("Error logging in");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Logged in succesfully");
      queryClient.invalidateQueries({ queryKey: ["current"] });
      // Small delay to ensure state is updated, then redirect
      setTimeout(() => {
        router.replace("/");
      }, 500);
    },
    onError: () => {
      toast.error("Error logging in");
    },
  });
  return mutation;
};
