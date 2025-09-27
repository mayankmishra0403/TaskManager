import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { AdminNotificationsManager } from "@/features/notifications/components/admin-notifications-manager";

export default async function AdminNotificationsPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  if (!isAdmin) redirect("/");

  return (
    <div className="p-6">
      <AdminNotificationsManager />
    </div>
  );
}
