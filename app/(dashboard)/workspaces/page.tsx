import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import CreateWorkspaceForm from "@/features/workspaces/components/create-workspace-form";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

export default async function WorkspacesPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";

  return (
    <div className="h-full p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {isAdmin ? "Manage Workspaces" : "My Workspaces"}
          </h1>
        </div>
        
        {isAdmin ? (
          <div className="mt-8">
            <CreateWorkspaceForm />
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-muted-foreground">
              You can view workspaces you are assigned to. Contact your admin to create new workspaces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
