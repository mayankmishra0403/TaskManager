import { Models } from "node-appwrite";

export type Employee = Models.Document & {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  workspaceId: string;
  userId: string; // Appwrite user ID
  createdBy: string; // Admin who created this employee
  isActive: boolean;
};
