"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={project.imageUrl} />
            <AvatarFallback className="text-lg font-semibold bg-blue-600 text-white">
              {project.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      {project.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {project.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
