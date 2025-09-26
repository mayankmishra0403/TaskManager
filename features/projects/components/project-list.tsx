"use client";

import { useGetProjects } from "../api/use-get-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectCard } from "./project-card";
import { CreateProjectModal } from "./create-project-modal";
import { useState } from "react";

interface ProjectListProps {
  workspaceId: string;
}

export const ProjectList = ({ workspaceId }: ProjectListProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: projects, isLoading } = useGetProjects({ workspaceId });

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {projects?.documents.map((project) => (
          <ProjectCard key={project.$id} project={project} />
        ))}
        
        {projects?.documents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create your first project
            </Button>
          </div>
        )}
      </div>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        workspaceId={workspaceId}
      />
    </>
  );
};
