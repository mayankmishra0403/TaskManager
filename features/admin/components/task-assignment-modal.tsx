"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { useGetEmployees } from "@/features/employees/api/use-get-employees";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useUpdateTask } from "@/features/tasks/api/use-update-task";
import { TaskPriority } from "@/features/tasks/schemas";

const assignTaskSchema = z.object({
  taskId: z.string().min(1, "Please select a task"),
  employeeId: z.string().min(1, "Please select an employee"),
  dueDate: z.date().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
});

interface TaskAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export const TaskAssignmentModal = ({
  open,
  onOpenChange,
  workspaceId,
}: TaskAssignmentModalProps) => {
  const { data: employees } = useGetEmployees({ workspaceId });
  const { data: tasks } = useGetTasks({ workspaceId });
  const { mutate: updateTask, isPending } = useUpdateTask();

  const form = useForm<z.infer<typeof assignTaskSchema>>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {},
  });

  const onSubmit = (values: z.infer<typeof assignTaskSchema>) => {
    const selectedTask = tasks?.documents.find(task => task.$id === values.taskId);
    if (!selectedTask) return;

    updateTask(
      {
        param: { taskId: values.taskId },
        json: {
          assigneeId: values.employeeId,
          dueDate: values.dueDate,
          priority: values.priority,
          status: selectedTask.status === 'BACKLOG' ? 'TODO' : selectedTask.status,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  const unassignedTasks = tasks?.documents.filter(task => !task.assigneeId) || [];
  const activeEmployees = employees?.documents.filter(emp => emp.isActive) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Task to Employee</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Task</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a task to assign" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unassignedTasks.map((task) => (
                        <SelectItem key={task.$id} value={task.$id}>
                          <div className="flex items-center gap-2">
                            <span>{task.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({task.priority})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Employee</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.$id} value={employee.userId}>
                          <div className="flex items-center gap-2">
                            <span>{employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({employee.department})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Set priority" />
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

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isPending ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
