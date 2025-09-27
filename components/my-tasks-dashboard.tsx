"use client";

import { useCurrent } from "@/features/auth/api/use-current";
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
  CheckCircle2,
  Circle,
  Timer,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

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

const MyTasksDashboard = () => {
  const { data: user, isLoading: userLoading } = useCurrent();
  
  // My Tasks shows only employee's assigned tasks
  const { data: employeeTasksData, isLoading: employeeTasksLoading } = useGetEmployeeTasks({ enabled: true });
  const { data: currentEmployee, isLoading: employeeLoading } = useGetCurrentEmployee({ enabled: true });
  
  const tasksData = employeeTasksData;
  const tasksLoading = employeeTasksLoading;

  if (userLoading || tasksLoading || employeeLoading) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 md:h-48" />
          ))}
        </div>
      </div>
    );
  }

  const tasks = tasksData?.documents || [];

  // My Tasks shows only tasks assigned to the current employee
  const visibleTasks = tasks;

  const tasksByStatus = {
    [TaskStatus.BACKLOG]: visibleTasks.filter(task => (task as any).status === TaskStatus.BACKLOG),
    [TaskStatus.TODO]: visibleTasks.filter(task => (task as any).status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: visibleTasks.filter(task => (task as any).status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: visibleTasks.filter(task => (task as any).status === TaskStatus.IN_REVIEW),
    [TaskStatus.DONE]: visibleTasks.filter(task => (task as any).status === TaskStatus.DONE),
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Tasks</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Tasks assigned specifically to you
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
          const StatusIcon = statusIcons[status as keyof typeof statusIcons];
          return (
            <Card key={status}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <StatusIcon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="font-medium text-xs md:text-sm truncate">
                    {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="text-lg md:text-2xl font-bold mt-1 md:mt-2">{statusTasks.length}</div>
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
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <StatusIcon className="h-4 w-4 md:h-5 md:w-5" />
                <h2 className="text-lg md:text-xl font-semibold">
                  {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <Badge variant="secondary" className="text-xs">{statusTasks.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {statusTasks.map((task) => (
                  <Card key={task.$id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 md:pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm md:text-base line-clamp-2 pr-2">
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
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Assigned to: You</span>
                        </div>
                        
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        {visibleTasks.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <div className="text-muted-foreground">
              <Circle className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
              <h3 className="text-base md:text-lg font-semibold mb-2">No tasks assigned</h3>
              <p className="text-sm md:text-base">You don't have any tasks assigned to you yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasksDashboard;
