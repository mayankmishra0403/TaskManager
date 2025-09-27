"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetAllTasks } from "@/features/admin/api/use-get-all-tasks";
import { useGetEmployeeTasks } from "@/features/tasks/api/use-get-employee-tasks";
import { useGetCurrentEmployee } from "@/features/employees/api/use-get-current-employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  CheckCircle2,
  Circle,
  Timer,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { useDeleteTask } from "@/features/tasks/api/use-delete-task";

const TaskStatus = {
  BACKLOG: "BACKLOG",
  TODO: "TODO", 
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
} as const;

const statusIcons = {
  [TaskStatus.BACKLOG]: AlertCircle,
  [TaskStatus.TODO]: Circle,
  [TaskStatus.IN_PROGRESS]: Timer,
  [TaskStatus.IN_REVIEW]: AlertCircle,
  [TaskStatus.DONE]: CheckCircle2,
};

const statusColors = {
  [TaskStatus.BACKLOG]: "bg-gray-400",
  [TaskStatus.TODO]: "bg-gray-500",
  [TaskStatus.IN_PROGRESS]: "bg-blue-500", 
  [TaskStatus.IN_REVIEW]: "bg-yellow-500",
  [TaskStatus.DONE]: "bg-green-500",
};

const MainDashboard = () => {
  const { data: user, isLoading: userLoading } = useCurrent();
  
  // Determine if user is admin
  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";
  
  // Dashboard shows ALL tasks for everyone (admin and employees)
  const { data: adminTasksData, isLoading: adminTasksLoading } = useGetAllTasks({ enabled: true });
  const { data: currentEmployee, isLoading: employeeLoading } = useGetCurrentEmployee({ enabled: !isAdmin });
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();
  
  // Dashboard always uses admin API to show all tasks
  const tasksData = adminTasksData;
  const tasksLoading = adminTasksLoading;

  if (userLoading || tasksLoading || (!isAdmin && employeeLoading)) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const tasks = tasksData?.documents || [];

  // Dashboard shows all tasks for everyone
  // Admin can manage tasks, employees can view all tasks with assignments
  const visibleTasks = tasks;

  const tasksByStatus: Record<string, any[]> = {
    [TaskStatus.BACKLOG]: visibleTasks.filter(task => (task as any).status === TaskStatus.BACKLOG),
    [TaskStatus.TODO]: visibleTasks.filter(task => (task as any).status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: visibleTasks.filter(task => (task as any).status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: visibleTasks.filter(task => (task as any).status === TaskStatus.IN_REVIEW),
    [TaskStatus.DONE]: visibleTasks.filter(task => (task as any).status === TaskStatus.DONE),
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isAdmin ? "Admin Dashboard" : `Welcome, ${user?.name}`}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isAdmin 
              ? "Manage all tasks and employees" 
              : "View all company tasks and assignments"
            }
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/admin/employees">
              <Button variant="outline" className="w-full sm:w-auto">
                <User className="size-4 mr-2" />
                <span className="hidden sm:inline">Manage Employees</span>
                <span className="sm:hidden">Employees</span>
              </Button>
            </Link>
            <Link href="/admin/tasks/create">
              <Button className="w-full sm:w-auto">
                <Plus className="size-4 mr-2" />
                <span className="hidden sm:inline">Create Task</span>
                <span className="sm:hidden">New Task</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
          const StatusIcon = statusIcons[status as keyof typeof statusIcons];
          return (
            <Card key={status}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <StatusIcon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="font-medium text-xs md:text-sm">
                    {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold mt-1 md:mt-2">{statusTasks.length}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tasks Grid */}
      <div className="space-y-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
          if (statusTasks.length === 0) return null;
          
          const StatusIcon = statusIcons[status as keyof typeof statusIcons];
          
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className="h-5 w-5" />
                <h2 className="text-xl font-semibold">
                  {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <Badge variant="secondary">{statusTasks.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {statusTasks.map((task) => (
                  <Card key={task.$id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 md:pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm md:text-base line-clamp-2">
                          {(task as any).name}
                        </CardTitle>
                        <div 
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[(task as any).status as keyof typeof statusColors]}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {(task as any).description && (
                        <div className="mb-2 md:mb-3">
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {(task as any).description}
                          </p>
                          {((task as any).description?.length || 0) > 120 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="mt-1 text-xs text-blue-600 hover:underline">
                                  View more
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="text-base md:text-lg">
                                    {(task as any).name || "Task details"}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <div className="text-xs uppercase text-muted-foreground mb-1">Description</div>
                                    <p className="whitespace-pre-wrap">
                                      {(task as any).description}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>Created: {format(new Date(task.$createdAt), 'MMM dd, yyyy')}</div>
                                    {(task as any).dueDate && (
                                      <div>Due: {format(new Date((task as any).dueDate), 'MMM dd, yyyy')}</div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-1 md:space-y-2 text-xs text-muted-foreground">
                        {(task as any).assigneeId && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              Assigned to: {(task as any).assigneeNames || (task as any).assignee?.name || "Unknown Employee"}
                            </span>
                          </div>
                        )}
                        
                        {(task as any).dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Due: {format(new Date((task as any).dueDate), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Created: {format(new Date(task.$createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        {(task as any).priority && (
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={
                                (task as any).priority === 'HIGH' ? 'destructive' : 
                                (task as any).priority === 'MEDIUM' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {(task as any).priority}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t grid grid-cols-2 gap-2">
                        {isAdmin && (
                          <Link href={`/admin/tasks/${task.$id}/edit`} className="col-span-1">
                            <Button size="sm" variant="outline" className="w-full text-xs md:text-sm">
                              Edit Task
                            </Button>
                          </Link>
                        )}
                        {(isAdmin) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className={`w-full text-xs md:text-sm ${!isAdmin ? "col-span-2" : ""}`}
                            disabled={deleting}
                            onClick={() => {
                              if (confirm("Delete this task? This action cannot be undone.")) {
                                deleteTask({ param: { taskId: task.$id } });
                              }
                            }}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {visibleTasks.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {isAdmin ? "No tasks created" : "No tasks assigned"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin 
              ? "Create your first task to get started." 
              : "Your admin hasn't assigned any tasks to you yet."
            }
          </p>
          {isAdmin && (
            <div className="mt-6">
              <Link href="/admin/tasks/create">
                <Button>
                  <Plus className="size-4 mr-2" />
                  Create Task
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
