import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  department: z.string().trim().min(1, "Department is required"),
  profilePhoto: z.instanceof(File).optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  employeeId: z.string().trim().min(1, "Employee ID is required").optional(),
  department: z.string().trim().min(1, "Department is required").optional(),
});

export const assignTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});
