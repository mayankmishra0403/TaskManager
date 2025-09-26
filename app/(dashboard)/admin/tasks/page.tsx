import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import MainDashboard from "@/components/main-dashboard";

export default async function AdminTasksPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
  
  if (!isAdmin) {
    redirect("/");
  }

  return <MainDashboard />;
}
