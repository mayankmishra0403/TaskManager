import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { SimpleTaskEdit } from "@/features/tasks/components/simple-task-edit";

interface EditTaskPageProps {
  params: {
    taskId: string;
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  // Check if user is admin
  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="h-full">
      <SimpleTaskEdit taskId={params.taskId} />
    </div>
  );
}
