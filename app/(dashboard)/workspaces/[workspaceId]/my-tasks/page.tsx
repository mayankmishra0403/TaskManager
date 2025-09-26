"use client";

import { useGetCurrentEmployee } from "@/features/employees/api/use-get-current-employee";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  Circle,
  Timer
} from "lucide-react";
import { TaskStatus } from "@/features/tasks/schemas";
import { format } from "date-fns";

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

const MyTasksPage = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: employee } = useGetCurrentEmployee();
  const { data: tasksData, isLoading } = useGetTasks({ workspaceId });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter tasks assigned to current user
  const myTasks = tasksData?.documents.filter(task => 
    task.assigneeId === user?.$id
  ) || [];

  const tasksByStatus = {
    [TaskStatus.BACKLOG]: myTasks.filter(task => task.status === TaskStatus.BACKLOG),
    [TaskStatus.TODO]: myTasks.filter(task => task.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: myTasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: myTasks.filter(task => task.status === TaskStatus.IN_REVIEW),
    [TaskStatus.DONE]: myTasks.filter(task => task.status === TaskStatus.DONE),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            Tasks assigned to you by your admin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {myTasks.length} Total Tasks
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(tasksByStatus).map(([status, tasks]) => {
          const StatusIcon = statusIcons[status as TaskStatus];
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="text-2xl font-bold mt-2">{tasks.length}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Tasks List */}
      <div className="space-y-6">
        {Object.entries(tasksByStatus).map(([status, tasks]) => {
          if (tasks.length === 0) return null;
          
          const StatusIcon = statusIcons[status as TaskStatus];
          
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <Badge variant="secondary">{tasks.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <Card key={task.$id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2">
                          {task.name}
                        </CardTitle>
                        <div 
                          className={`w-3 h-3 rounded-full ${statusColors[task.status as TaskStatus]}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {task.projectId && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Project: {task.projectId}</span>
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {format(new Date(task.$createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        {task.assignedBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Assigned by Admin</span>
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
      </div>

      {myTasks.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tasks assigned</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your admin hasn't assigned any tasks to you yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
