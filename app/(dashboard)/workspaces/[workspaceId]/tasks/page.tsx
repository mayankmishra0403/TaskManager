import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { TaskList } from "@/features/tasks/components/task-list";

interface TasksPageProps {
  params: {
    workspaceId: string;
  };
}

const TasksPage = async ({ params }: TasksPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="h-full flex flex-col">
      <TaskList workspaceId={params.workspaceId} />
    </div>
  );
};

export default TasksPage;
