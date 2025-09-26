"use client";

import { useGetCurrentEmployee } from "../api/use-get-current-employee";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ListTodo, 
  FolderIcon, 
  User, 
  Calendar,
  Clock,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export const EmployeeDashboard = () => {
  const { data: user } = useCurrent();
  const { data: employee, isLoading: employeeLoading } = useGetCurrentEmployee();
  const { data: allTasks } = useGetTasks({ workspaceId: employee?.workspaceId || "" });
  const { data: projects } = useGetProjects({ workspaceId: employee?.workspaceId || "" });

  if (employeeLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Employee Profile Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please contact your administrator to set up your employee profile.
          </p>
        </div>
      </div>
    );
  }

  // Filter tasks assigned to current employee
  const myTasks = allTasks?.documents.filter(task => task.assigneeId === employee.$id) || [];
  const completedTasks = myTasks.filter(task => task.status === "DONE");
  const inProgressTasks = myTasks.filter(task => task.status === "IN_PROGRESS");
  const todoTasks = myTasks.filter(task => task.status === "TODO");
  const overdueTasks = myTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"
  );

  // Get assigned projects
  const assignedProjects = projects?.documents.filter(project => 
    employee.assignedProjects?.includes(project.$id)
  ) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {employee.name}!</h1>
          <p className="text-muted-foreground">
            {employee.department} • Employee ID: {employee.employeeId}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground">Total assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Projects */}
      {assignedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedProjects.map((project) => (
                <div
                  key={project.$id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <FolderIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Tasks
              <Badge variant="secondary">{todoTasks.length + inProgressTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...todoTasks, ...inProgressTasks].slice(0, 5).map((task) => (
                <div key={task.$id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <h4 className="font-medium text-sm">{task.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Priority: {task.priority}</span>
                        {task.dueDate && (
                          <>
                            <Calendar className="h-3 w-3" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={
                    task.priority === 'HIGH' ? 'destructive' : 
                    task.priority === 'MEDIUM' ? 'default' : 'secondary'
                  }>
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {(todoTasks.length + inProgressTasks.length) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Completed Tasks
              <Badge variant="outline">{completedTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map((task) => (
                <div key={task.$id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div>
                      <h4 className="font-medium text-sm">{task.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    Done
                  </Badge>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed tasks yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
