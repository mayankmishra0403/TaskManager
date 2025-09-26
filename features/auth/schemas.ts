import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Employee ID or Email is required"),
  password: z.string().min(1, "Password is required"),
});
