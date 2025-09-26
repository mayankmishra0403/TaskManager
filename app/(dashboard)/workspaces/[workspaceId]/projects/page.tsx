import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { ProjectList } from "@/features/projects/components/project-list";

interface ProjectsPageProps {
  params: {
    workspaceId: string;
  };
}

const ProjectsPage = async ({ params }: ProjectsPageProps) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="h-full flex flex-col">
      <ProjectList workspaceId={params.workspaceId} />
    </div>
  );
};

export default ProjectsPage;
