"use client";

import { useState, useEffect } from "react";
import { useUpdateTask } from "../api/use-update-task";
import { useGetTask } from "../api/use-get-task";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskStatus, TaskPriority } from "../schemas";

const updateTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum([TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE]),
  priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]),
  dueDate: z.string().optional(),
});

type UpdateTaskForm = z.infer<typeof updateTaskSchema>;

interface SimpleTaskEditProps {
  taskId: string;
}

export const SimpleTaskEdit = ({ taskId }: SimpleTaskEditProps) => {
  const router = useRouter();
  const { data: task, isLoading: taskLoading } = useGetTask(taskId);
  const { data: employees } = useGetAllEmployees();
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { data: user } = useCurrent();

  const form = useForm<UpdateTaskForm>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      assigneeId: "unassigned",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: "",
    },
  });

  // Update form when task data loads
  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        description: task.description || "",
        assigneeId: task.assigneeId || "unassigned",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      });
    }
  }, [task, form]);

  const onSubmit = (data: UpdateTaskForm) => {
    const cleanData = {
      name: data.name,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId === "unassigned" ? "unassigned" : data.assigneeId,
      dueDate: data.dueDate || undefined,
    };

    updateTask(
      { 
        taskId,
        data: cleanData 
      },
      {
        onSuccess: () => {
          toast.success("Task updated successfully");
          router.push("/");
        },
        onError: (error: any) => {
          toast.error("Failed to update task");
          console.error(error);
        },
      }
    );
  };

  if (taskLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900">Task not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The task you're looking for doesn't exist.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Edit Task</h1>
          <p className="text-muted-foreground">
            Update task details and assignment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter task name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe the task (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigneeId">Assign to Employee</Label>
                <Select
                  value={form.watch("assigneeId")}
                  onValueChange={(value) => form.setValue("assigneeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees?.documents.map((employee) => (
                      <SelectItem key={employee.userId} value={employee.userId}>
                        {employee.name} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(value) => form.setValue("priority", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Task"}
                <Save className="size-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
