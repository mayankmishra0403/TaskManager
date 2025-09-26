import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
  workspaceId: z.string().min(1, "Required"),
  image: z
    .union([
      z.instanceof(Blob),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Required").optional(),
  description: z.string().optional(),
  image: z
    .union([
      z.instanceof(Blob),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
});
