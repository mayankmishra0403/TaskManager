import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { WorkspaceDashboard } from "@/features/workspaces/components/workspace-dashboard";

interface WorkspaceIdPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function WorkspaceIdPage({ params }: WorkspaceIdPageProps) {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return (
    <div className="h-full">
      <WorkspaceDashboard workspaceId={params.workspaceId} />
    </div>
  );
}
