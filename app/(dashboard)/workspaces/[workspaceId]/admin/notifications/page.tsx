import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { AdminNotificationsManager } from "@/features/notifications/components/admin-notifications-manager";

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceAdminNotificationsPage({ params }: PageProps) {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  if (!isAdmin) redirect(`/workspaces/${params.workspaceId}`);

  return (
    <div className="p-6">
      <AdminNotificationsManager />
    </div>
  );
}
