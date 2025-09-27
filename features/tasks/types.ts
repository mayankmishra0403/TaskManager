import { Models } from "node-appwrite";
import { TaskStatus, TaskPriority } from "./schemas";

export type Task = Models.Document & {
  name: string;
  description?: string;
  workspaceId: string;
  projectId?: string;
  assigneeId?: string;
  assigneeIds?: string[]; // Support multiple assignees
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  position: number;
};
