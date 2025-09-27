"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTaskSchema, TaskStatus, TaskPriority } from "../schemas";
import { useCreateTask } from "../api/use-create-task";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";
import { useCurrent } from "@/features/auth/api/use-current";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export const CreateTaskModal = ({
  open,
  onOpenChange,
  workspaceId,
}: CreateTaskModalProps) => {
  const { mutate, isPending } = useCreateTask();
  const { data: projects } = useGetProjects({ workspaceId });
  const { data: allEmployees } = useGetAllEmployees();
  const { data: user } = useCurrent();

  // Debug: Log the employees data
  console.log("All employees data:", allEmployees);

  // Check if user is admin
  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

  // Local state for managing selected employees
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      workspaceId,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIds: [], // Support multiple assignees
    },
  });

  // Watch form values for debugging
  const watchedValues = form.watch();
  console.log("Current form values:", watchedValues);
  console.log("Current assigneeIds:", watchedValues.assigneeIds);

  // Sync selected employees with form when state changes
  useEffect(() => {
    console.log("=== SYNCING EMPLOYEE IDS TO FORM ===");
    console.log("Selected Employee IDs:", selectedEmployeeIds);
    form.setValue("assigneeIds", selectedEmployeeIds, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
    console.log("Form updated with assigneeIds:", selectedEmployeeIds);
  }, [selectedEmployeeIds, form]);

  const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Complete form values:", JSON.stringify(values, null, 2));
    console.log("AssigneeIds specifically:", values.assigneeIds);
    console.log("AssigneeIds type:", typeof values.assigneeIds);
    console.log("AssigneeIds length:", values.assigneeIds?.length);
    console.log("Form data being sent:", { json: values });
    console.log("=== END DEBUG ===");
    
    mutate(
      { json: values },
      {
        onSuccess: () => {
          form.reset();
          setSelectedEmployeeIds([]); // Reset local state
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter task name..."
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter task description..."
                      disabled={isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (Optional)</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.documents.map((project) => (
                        <SelectItem key={project.$id} value={project.$id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Assign to Employees (Optional - Select Multiple)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {allEmployees?.documents.map((employee) => {
                    const isChecked = selectedEmployeeIds.includes(employee.$id);
                    console.log(`Employee ${employee.name} (${employee.$id}) - isChecked: ${isChecked}`);
                    
                    const handleEmployeeToggle = (checked: boolean) => {
                      console.log("=== TOGGLE EMPLOYEE (LOCAL STATE) ===");
                      console.log("Employee ID:", employee.$id);
                      console.log("Employee Name:", employee.name);
                      console.log("Checked:", checked);
                      console.log("Current selectedEmployeeIds:", selectedEmployeeIds);
                      
                      let newSelectedIds = [...selectedEmployeeIds];
                      
                      if (checked) {
                        // Add employee if not already selected
                        if (!newSelectedIds.includes(employee.$id)) {
                          newSelectedIds.push(employee.$id);
                        }
                      } else {
                        // Remove employee
                        newSelectedIds = newSelectedIds.filter(id => id !== employee.$id);
                      }
                      
                      console.log("New selectedEmployeeIds:", newSelectedIds);
                      setSelectedEmployeeIds(newSelectedIds);
                      console.log("=== END TOGGLE ===");
                    };
                    
                    return (
                      <div key={employee.$id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`create-employee-${employee.$id}`}
                          checked={isChecked}
                          onChange={(e) => handleEmployeeToggle(e.target.checked)}
                          disabled={isPending}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`create-employee-${employee.$id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <div className="flex items-center justify-between">
                            <span>{employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.department || 'No Department'}
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                  {(!allEmployees?.documents || allEmployees.documents.length === 0) && (
                    <p className="text-sm text-muted-foreground">No employees available</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <p>Selected: {selectedEmployeeIds.length} employee(s)</p>
                  {selectedEmployeeIds.length > 0 && (
                    <p className="text-blue-600 mt-1">
                      Selected IDs: {selectedEmployeeIds.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
