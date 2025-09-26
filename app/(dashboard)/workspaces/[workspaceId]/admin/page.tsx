import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

interface AdminPageProps {
  params: {
    workspaceId: string;
  };
}

const AdminPage = async ({ params }: AdminPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.email === 'admin@company.com' || user.name?.toLowerCase().includes('admin');
  if (!isAdmin) {
    redirect(`/workspaces/${params.workspaceId}`);
  }

  return (
    <div className="h-full">
      <AdminDashboard workspaceId={params.workspaceId} />
    </div>
  );
};

export default AdminPage;
