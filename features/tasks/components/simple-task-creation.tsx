"use client";

import { useState } from "react";
import { useCreateTask } from "../api/use-create-task";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskStatus, TaskPriority } from "../schemas";

const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  description: z.string().optional(),
  // Multiple assignees support
  assigneeIds: z.array(z.string()).optional(),
  status: z.enum([TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE]).default(TaskStatus.TODO),
  priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]).default(TaskPriority.MEDIUM),
  dueDate: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

export const SimpleTaskCreation = () => {
  const router = useRouter();
  const { data: employees } = useGetAllEmployees();
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: user } = useCurrent();

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
  assigneeIds: [],
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: "",
    },
  });

  const onSubmit = (data: CreateTaskForm) => {
    // Remove empty fields
    const cleanData = {
      ...data,
      workspaceId: "default", // We'll use a default workspace for now
      // Prefer multiple assignees; send undefined if none selected
      assigneeIds: data.assigneeIds && data.assigneeIds.length ? data.assigneeIds : undefined,
      description: data.description || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };

    createTask(
      { json: cleanData },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          router.push("/");
        },
        onError: (error) => {
          toast.error("Failed to create task");
          console.error(error);
        },
      }
    );
  };

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
          <h1 className="text-2xl font-semibold">Create New Task</h1>
          <p className="text-muted-foreground">
            Create and assign tasks to employees
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
                <Label>Assign to Employees (Multiple)</Label>
                <div className="mt-2 space-y-2 max-h-44 overflow-y-auto rounded-md border p-3">
                  {employees?.documents?.length ? (
                    employees.documents.map((employee) => (
                      <div key={employee.$id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={employee.$id}
                          // RHF collects all checked values into an array for the same field name
                          {...form.register("assigneeIds")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`emp-${employee.$id}`} className="cursor-pointer">
                          {employee.name} {employee.employeeId ? `(${employee.employeeId})` : ""}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No employees available</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {form.watch("assigneeIds")?.length || 0} employee(s)
                </p>
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
                {isPending ? "Creating..." : "Create Task"}
                <Plus className="size-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
