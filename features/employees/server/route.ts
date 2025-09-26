import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";

import { createEmployeeSchema, updateEmployeeSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import {
  DATABASE_ID,
  EMPLOYEES_ID,
  WORKSPACES_ID,
  MEMBERS_ID,
} from "@/config";
import { MemberRole } from "@/features/members/types";

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
    zValidator("json", createEmployeeSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { name, email, password, employeeId, department } = c.req.valid("json");

      // Check if user is admin - only admin can create employees
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
      if (!isAdmin) {
        return c.json({ error: "Unauthorized. Only admin can create employees." }, 403);
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
      const { account } = await createAdminClient();
      
      let newUser;
      try {
        newUser = await account.create(ID.unique(), email, password, name);
      } catch (error: any) {
        if (error.code === 409) {
          return c.json({ error: "Email already exists in the system" }, 400);
        }
        throw error;
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
