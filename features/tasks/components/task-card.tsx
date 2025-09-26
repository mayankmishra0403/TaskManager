"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { Task } from "../types";
import { TaskPriority } from "../schemas";

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  [TaskPriority.LOW]: "bg-blue-100 text-blue-800",
  [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800", 
  [TaskPriority.HIGH]: "bg-red-100 text-red-800",
};

export const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <Card className="cursor-pointer hover:shadow-sm transition">
      <CardContent className="p-3">
        <div className="space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{task.name}</h3>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`text-xs ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </Badge>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {task.assigneeId && (
                <div className="flex items-center gap-1">
                  <User className="size-3" />
                  <span>Assigned</span>
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
