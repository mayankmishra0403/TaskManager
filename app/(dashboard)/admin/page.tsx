import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { GlobalAdminDashboard } from "@/features/admin/components/global-admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="h-full">
      <GlobalAdminDashboard />
    </div>
  );
}
