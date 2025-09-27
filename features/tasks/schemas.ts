import { z } from "zod";

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO", 
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
  workspaceId: z.string().min(1, "Required"),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(), // Support multiple assignees
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().min(1, "Required").optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(), // Support multiple assignees
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
  position: z.number().int().positive().optional(),
});
