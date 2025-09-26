import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { SimpleEmployeeManagement } from "@/features/employees/components/simple-employee-management";

export default async function AdminEmployeesPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="h-full">
      <SimpleEmployeeManagement />
    </div>
  );
}
