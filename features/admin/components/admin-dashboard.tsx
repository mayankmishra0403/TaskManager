"use client";

import { useGetEmployees } from "@/features/employees/api/use-get-employees";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ListTodo, FolderIcon, UserPlus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { TaskAssignmentModal } from "./task-assignment-modal";
import { useState } from "react";

interface AdminDashboardProps {
  workspaceId: string;
}

export const AdminDashboard = ({ workspaceId }: AdminDashboardProps) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const { data: employees } = useGetEmployees({ workspaceId });
  const { data: tasks } = useGetTasks({ workspaceId });
  const { data: projects } = useGetProjects({ workspaceId });

  const totalEmployees = employees?.documents.length || 0;
  const activeEmployees = employees?.documents.filter(emp => emp.isActive).length || 0;
  const totalTasks = tasks?.documents.length || 0;
  const assignedTasks = tasks?.documents.filter(task => task.assigneeId).length || 0;
  const completedTasks = tasks?.documents.filter(task => task.status === "DONE").length || 0;
  const overdueTasks = tasks?.documents.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"
  ).length || 0;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/workspaces/${workspaceId}/employees`}>
                <UserPlus className="size-4 mr-2" />
                Manage Employees
              </Link>
            </Button>
            <Button onClick={() => setIsAssignModalOpen(true)}>
              <ClipboardList className="size-4 mr-2" />
              Assign Tasks
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {activeEmployees} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {assignedTasks} assigned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Task Assignments
                <Button variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                  Assign More
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks?.documents
                  .filter(task => task.assigneeId)
                  .slice(0, 5)
                  .map((task) => {
                    const assignee = employees?.documents.find(emp => emp.userId === task.assigneeId);
                    return (
                                      {tasks?.documents.filter(task => task.assigneeId).slice(0, 5).map((task) => {
                    const assignee = employees?.documents.find(emp => emp.$id === task.assigneeId);
                    return (
                      <div key={task.$id} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            task.status === 'DONE' ? 'bg-green-500' : 
                            task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Assigned to: {assignee?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {assignedTasks === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Employee Overview
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/workspaces/${workspaceId}/employees`}>View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees?.documents.slice(0, 5).map((employee) => {
                  const employeeTasks = tasks?.documents.filter(task => task.assigneeId === employee.$id) || [];
                  const completedCount = employeeTasks.filter(task => task.status === 'DONE').length;
                  
                  return (
                    <div key={employee.$id} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.department} • ID: {employee.employeeId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{employeeTasks.length} tasks</p>
                        <p className="text-xs text-muted-foreground">
                          {completedCount} completed
                        </p>
                      </div>
                    </div>
                  );
                })}
                {totalEmployees === 0 && (
                  <p className="text-sm text-muted-foreground">No employees added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskAssignmentModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        workspaceId={workspaceId}
      />
    </>
  );
};
