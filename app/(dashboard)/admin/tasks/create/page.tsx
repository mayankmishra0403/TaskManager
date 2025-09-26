import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { SimpleTaskCreation } from "@/features/tasks/components/simple-task-creation";

export default async function CreateTaskPage() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="h-full">
      <SimpleTaskCreation />
    </div>
  );
}
