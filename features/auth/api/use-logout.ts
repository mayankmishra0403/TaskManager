import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.auth.logout)["$post"]>;

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.auth.logout["$post"]();
      if (!response.ok) {
        throw new Error("Error logging out");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Logged out");
      queryClient.invalidateQueries({ queryKey: ["current"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      // Force redirect to sign-in page after logout
      router.replace("/sign-in");
    },
    onError: () => {
      toast.error("Error logging out");
    },
  });
  return mutation;
};
