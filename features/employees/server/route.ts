import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { createEmployeeSchema, updateEmployeeSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { getAppwriteConfig } from "@/lib/env-config";

import {
  DATABASE_ID,
  EMPLOYEES_ID,
  WORKSPACES_ID,
  MEMBERS_ID,
} from "@/config";
import { MemberRole } from "@/features/members/types";

// Schema for form data validation
const createEmployeeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
});

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Check if user is admin - only admin can view employees
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can view employees." }, 403);
    }

    const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
      Query.orderDesc("$createdAt"),
    ]);

    return c.json({ data: employees });
  })
  .post(
    "/",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      // Check if user is admin - only admin can create employees
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
      if (!isAdmin) {
        return c.json({ error: "Unauthorized. Only admin can create employees." }, 403);
      }

      // Parse form data
      const formData = await c.req.formData();
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const employeeId = formData.get("employeeId") as string;
      const department = formData.get("department") as string;
      const profilePhoto = formData.get("profilePhoto") as File | null;

      // Validate required fields
      const validation = createEmployeeFormSchema.safeParse({
        name,
        email,
        password,
        employeeId,
        department,
      });

      if (!validation.success) {
        return c.json({ error: "Invalid input data", details: validation.error.errors }, 400);
      }

      // Check if employee ID already exists globally
      const existingEmployee = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
        Query.equal("employeeId", employeeId),
      ]);

      if (existingEmployee.total > 0) {
        return c.json({ error: "Employee ID already exists" }, 400);
      }

      // Check if email already exists in employees
      const existingEmployeeByEmail = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
        Query.equal("email", email),
      ]);

      if (existingEmployeeByEmail.total > 0) {
        return c.json({ error: "Email already exists as an employee" }, 400);
      }

      // Create Appwrite user account
      const { account, storage } = await createAdminClient();
      
      let newUser;
      try {
        newUser = await account.create(ID.unique(), email, password, name);
      } catch (error: any) {
        if (error.code === 409) {
          return c.json({ error: "Email already exists in the system" }, 400);
        }
        throw error;
      }

      // Handle profile photo upload
      let profilePhotoId: string | undefined;
      let profilePhotoUrl: string | undefined;

      if (profilePhoto && profilePhoto.size > 0 && profilePhoto.name) {
        try {
          const config = getAppwriteConfig();
          const fileId = ID.unique();
          
          console.log("Processing photo upload:", {
            fileName: profilePhoto.name,
            fileSize: profilePhoto.size,
            fileType: profilePhoto.type || 'unknown'
          });
          
          // Convert File to ArrayBuffer for Appwrite
          const arrayBuffer = await profilePhoto.arrayBuffer();
          
          // Create a new File object with the same properties
          const fileForUpload = new File(
            [arrayBuffer], 
            profilePhoto.name, 
            { 
              type: profilePhoto.type || 'application/octet-stream'
            }
          );
          
          console.log("Uploading to Appwrite storage...");
          
          // Upload to storage 
          const file = await storage.createFile(
            config.storageId,
            fileId,
            fileForUpload
            // Note: Permissions will be inherited from bucket settings
          );

          profilePhotoId = file.$id;
          // Create public URL for the image
          profilePhotoUrl = `${config.endpoint}/storage/buckets/${config.storageId}/files/${file.$id}/view?project=${config.project}`;
          
          console.log("Photo upload successful:", {
            fileId: profilePhotoId,
            fileName: file.name,
            fileSize: file.sizeOriginal
          });
        } catch (error) {
          console.error("Profile photo upload failed:", error);
          // Continue without photo if upload fails
        }
      }

      // Get a default workspace (or create one if none exists)
      let defaultWorkspaceId = "default";
      try {
        const workspaces = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID, [
          Query.limit(1),
        ]);
        if (workspaces.total > 0) {
          defaultWorkspaceId = workspaces.documents[0].$id;
        } else {
          // Create a default workspace
          const defaultWorkspace = await databases.createDocument(
            DATABASE_ID,
            WORKSPACES_ID,
            ID.unique(),
            {
              name: "Default Company",
              imageUrl: "",
              inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              userId: user.$id,
            }
          );
          defaultWorkspaceId = defaultWorkspace.$id;
        }
      } catch (error) {
        console.log("Workspace handling error:", error);
      }

      // Create employee record
      const employee = await databases.createDocument(
        DATABASE_ID,
        EMPLOYEES_ID,
        ID.unique(),
        {
          name,
          email,
          employeeId,
          department,
          userId: newUser.$id,
          createdBy: user.$id,
          isActive: true,
          workspaceId: defaultWorkspaceId,
          ...(profilePhotoId && { profilePhotoId }),
          ...(profilePhotoUrl && { profilePhotoUrl }),
        },
      );

      return c.json({ data: employee });
    },
  )
  .get("/current", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Find employee record for current user
    const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
      Query.equal("userId", user.$id),
    ]);

    if (employees.total === 0) {
      return c.json({ error: "Employee record not found" }, 404);
    }

    return c.json({ data: employees.documents[0] });
  })
  .patch(
    "/:employeeId",
    sessionMiddleware,
    zValidator("json", updateEmployeeSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { employeeId } = c.req.param();
      const { name, employeeId: newEmployeeId, department } = c.req.valid("json");

      const existingEmployee = await databases.getDocument(
        DATABASE_ID,
        EMPLOYEES_ID,
        employeeId,
      );

      // Check if user is admin of workspace
      const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", existingEmployee.workspaceId),
        Query.equal("userId", user.$id),
      ]);

      const memberData = member.documents[0];
      if (!memberData || memberData.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized - Admin access required" }, 401);
      }

      const employee = await databases.updateDocument(
        DATABASE_ID,
        EMPLOYEES_ID,
        employeeId,
        {
          name: name ?? existingEmployee.name,
          employeeId: newEmployeeId ?? existingEmployee.employeeId,
          department: department ?? existingEmployee.department,
        },
      );

      return c.json({ data: employee });
    },
  )
  .delete("/:employeeId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { employeeId } = c.req.param();

    const existingEmployee = await databases.getDocument(
      DATABASE_ID,
      EMPLOYEES_ID,
      employeeId,
    );

    // Check if user is admin of workspace
    const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
      Query.equal("workspaceId", existingEmployee.workspaceId),
      Query.equal("userId", user.$id),
    ]);

    const memberData = member.documents[0];
    if (!memberData || memberData.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    // Mark employee as inactive instead of deleting
    const employee = await databases.updateDocument(
      DATABASE_ID,
      EMPLOYEES_ID,
      employeeId,
      {
        isActive: false,
      },
    );

    return c.json({ data: employee });
  });

export default app;
