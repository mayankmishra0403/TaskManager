import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import MyTasksDashboard from "@/components/my-tasks-dashboard";

export default async function MyTasksPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  
  if (isAdmin) {
    // Admin sees all tasks, redirect to main dashboard
    redirect("/");
  }

  return <MyTasksDashboard />;
}
