"use client";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCurrent } from "@/features/auth/api/use-current";
import { RiAddCircleFill } from "react-icons/ri";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { useRouter } from "next/navigation";

export const WorkspaceSwitcher = () => {
  const { data: workspaces } = useGetWorkspaces();
  const { data: user } = useCurrent();

  const router = useRouter();

  // Check if user is admin
  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

  const onSelect = (id: string) => {
    router.push(`/workspaces/${id}`);
  };
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-neutral-500">Workspaces</p>
        {isAdmin && (
          <RiAddCircleFill className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition" />
        )}
      </div>
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-full bg-neutral-200 font-medium p-1">
          <SelectValue placeholder="No workspace selected" />
          <SelectContent>
            {workspaces?.documents.map((workspace) => (
              <SelectItem key={workspace.$id} value={workspace.$id}>
                <div className="flex justify-start items-center gap-3 font-medium">
                  <WorkspaceAvatar
                    name={workspace.name}
                    image={workspace.imageUrl}
                  />
                  <span className="truncate">{workspace.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </SelectTrigger>
      </Select>
    </div>
  );
};
