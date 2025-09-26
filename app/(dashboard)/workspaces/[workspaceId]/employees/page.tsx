import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { EmployeeManagement } from "@/features/employees/components/employee-management";

interface EmployeesPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  
  if (!isAdmin) {
    redirect(`/workspaces/${params.workspaceId}`);
  }

  return (
    <div className="h-full">
      <EmployeeManagement workspaceId={params.workspaceId} />
    </div>
  );
}
