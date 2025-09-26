"use client";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderIcon, ListTodo, Plus, Users } from "lucide-react";
import Link from "next/link";

interface WorkspaceDashboardProps {
  workspaceId: string;
}

export const WorkspaceDashboard = ({ workspaceId }: WorkspaceDashboardProps) => {
  const { data: projects } = useGetProjects({ workspaceId });
  const { data: tasks } = useGetTasks({ workspaceId });
  const { data: user } = useCurrent();

  // Check if user is admin
  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

  // Filter tasks for employees - they only see assigned tasks
  const displayTasks = isAdmin ? tasks?.documents : tasks?.documents.filter(task => task.assigneeId === user?.$id);
  
  const totalProjects = projects?.documents.length || 0;
  const totalTasks = displayTasks?.length || 0;
  const completedTasks = displayTasks?.filter(task => task.status === "DONE").length || 0;
  const inProgressTasks = displayTasks?.filter(task => task.status === "IN_PROGRESS").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? "Admin Dashboard" : "Employee Dashboard"}
        </h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/workspaces/${workspaceId}/projects`}>
              <FolderIcon className="size-4 mr-2" />
              View Projects
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/workspaces/${workspaceId}/tasks`}>
              <ListTodo className="size-4 mr-2" />
              {isAdmin ? "Manage Tasks" : "My Tasks"}
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild>
              <Link href={`/workspaces/${workspaceId}/employees`}>
                <Users className="size-4 mr-2" />
                Manage Employees
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Projects
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/projects`}>View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects?.documents.slice(0, 5).map((project) => (
                <div key={project.$id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{project.name}</span>
                  </div>
                </div>
              ))}
              {totalProjects === 0 && (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Tasks
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/tasks`}>View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayTasks?.slice(0, 5).map((task) => (
                <div key={task.$id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === 'DONE' ? 'bg-green-500' : 
                      task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium">{task.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {task.priority.toLowerCase()}
                  </span>
                </div>
              ))}
              {totalTasks === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "No tasks yet" : "No tasks assigned to you"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
