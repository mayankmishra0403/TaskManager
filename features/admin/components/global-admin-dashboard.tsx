"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FolderIcon, 
  ListTodo, 
  Building2, 
  Mail, 
  User, 
  Calendar,
  Shield,
  Plus,
  Eye,
  Megaphone
} from "lucide-react";
import Link from "next/link";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useGetAllTasks } from "@/features/admin/api/use-get-all-tasks";
import { useGetAllProjects } from "@/features/admin/api/use-get-all-projects";
import { useCurrent } from "@/features/auth/api/use-current";
import { AdminNotificationsManager } from "@/features/notifications/components/admin-notifications-manager";

export const GlobalAdminDashboard = () => {
  const { data: user } = useCurrent();
  const { data: allEmployees, isLoading: employeesLoading } = useGetAllEmployees();
  const { data: workspaces, isLoading: workspacesLoading } = useGetWorkspaces();
  const { data: allTasks, isLoading: tasksLoading } = useGetAllTasks();
  const { data: allProjects, isLoading: projectsLoading } = useGetAllProjects();

  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Only administrators can access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (employeesLoading || workspacesLoading || tasksLoading || projectsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalEmployees = (allEmployees?.documents as any[] | undefined)?.length || 0;
  const totalWorkspaces = (workspaces?.documents as any[] | undefined)?.length || 0;
  const totalProjects = (allProjects?.documents as any[] | undefined)?.length || 0;
  const totalTasks = (allTasks?.documents as any[] | undefined)?.length || 0;
  const completedTasks = ((allTasks?.documents as any[] | undefined) || []).filter((task: any) => (task as any).status === "DONE").length;
  const pendingTasks = ((allTasks?.documents as any[] | undefined) || []).filter((task: any) => (task as any).status === "TODO").length;
  const inProgressTasks = ((allTasks?.documents as any[] | undefined) || []).filter((task: any) => (task as any).status === "IN_PROGRESS").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage all workspaces, employees, projects, and tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/notifications">
              Manage Notifications
            </Link>
          </Button>
          <Button asChild>
            <Link href="/workspaces">
              <Plus className="size-4 mr-2" />
              Create Workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Across all workspaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkspaces}</div>
            <p className="text-xs text-muted-foreground">Active workspaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Total projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed, {inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">All Employees</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Megaphone className="h-3 w-3" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Employees Created by Admin</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage all employees across all workspaces
              </p>
            </CardHeader>
            <CardContent>
              {totalEmployees === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No employees</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create workspaces and add employees to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {((allEmployees?.documents as any[] | undefined) || []).map((employee: any) => (
                    <div
                      key={employee.$id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>ID: {employee.employeeId}</span>
                            <span>Dept: {employee.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Created {new Date(employee.$createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Employee</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/workspaces/${employee.workspaceId}/employees`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {((workspaces?.documents as any[] | undefined) || []).map((workspace: any) => (
                  <div
                    key={workspace.$id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{workspace.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Created {new Date(workspace.$createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/workspaces/${workspace.$id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage all tasks across all workspaces
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {((allTasks?.documents as any[] | undefined) || []).map((task: any) => (
                  <div
                    key={task.$id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-3 w-3 rounded-full ${
                        (task as any).status === 'DONE' ? 'bg-green-500' : 
                        (task as any).status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <h3 className="font-medium">{(task as any).name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Priority: {(task as any).priority}</span>
                          <span>Status: {(task as any).status.replace('_', ' ')}</span>
                          {(task as any).assignedBy && <span>Assigned by: Admin</span>}
                        </div>
                        {(task as any).dueDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date((task as any).dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        (task as any).priority === 'HIGH' ? 'destructive' : 
                        (task as any).priority === 'MEDIUM' ? 'default' : 'secondary'
                      }>
                        {(task as any).priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {((allProjects?.documents as any[] | undefined) || []).map((project: any) => (
                  <div
                    key={project.$id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Created {new Date(project.$createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <AdminNotificationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
