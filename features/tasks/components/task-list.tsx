"use client";

import { useGetTasks } from "../api/use-get-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import { CreateTaskModal } from "./create-task-modal";
import { useState } from "react";
import { TaskStatus } from "../schemas";

interface TaskListProps {
  workspaceId: string;
}

const columns = [
  {
    id: TaskStatus.BACKLOG,
    title: "Backlog",
  },
  {
    id: TaskStatus.TODO,
    title: "Todo",
  },
  {
    id: TaskStatus.IN_PROGRESS,
    title: "In Progress",
  },
  {
    id: TaskStatus.IN_REVIEW,
    title: "In Review",
  },
  {
    id: TaskStatus.DONE,
    title: "Done",
  },
];

export const TaskList = ({ workspaceId }: TaskListProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: tasks, isLoading } = useGetTasks({ workspaceId });

  const tasksByStatus = tasks?.documents.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, any[]>) || {};

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-6 min-w-max">
          {columns.map((column) => (
            <Card key={column.id} className="w-80 shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {column.title}
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {tasksByStatus[column.id]?.length || 0}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {tasksByStatus[column.id]?.map((task) => (
                  <TaskCard key={task.$id} task={task} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        workspaceId={workspaceId}
      />
    </>
  );
};
