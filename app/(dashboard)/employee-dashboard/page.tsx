import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { EmployeeDashboard } from "@/features/employees/components/employee-dashboard";

export default async function EmployeeDashboardPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
  
  if (isAdmin) {
    redirect("/admin");
  }

  return (
    <div className="h-full">
      <EmployeeDashboard />
    </div>
  );
}
