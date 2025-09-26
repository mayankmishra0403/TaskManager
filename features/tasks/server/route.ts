import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";

import { createTaskSchema, updateTaskSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";

import {
  DATABASE_ID,
  TASKS_ID,
  MEMBERS_ID,
  EMPLOYEES_ID,
} from "@/config";
import { MemberRole } from "@/features/members/types";
import { Task } from "../types";

const app = new Hono()
  .get("/my-tasks", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    console.log("My-tasks request for user:", user.email, "ID:", user.$id);

    // Find employee record for current user
    const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
      Query.equal("userId", user.$id),
    ]);

    console.log("Found employees:", employees.total);

    if (employees.total === 0) {
      console.log("No employee record found for user:", user.email);
      // Return empty tasks instead of 404 - user might not be an employee
      return c.json({ data: { documents: [], total: 0 } });
    }

    const employee = employees.documents[0];
    console.log("Employee found:", employee.name, "Employee ID:", employee.$id);

    // Get tasks assigned to this specific employee only
    const tasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal("assigneeId", employee.$id),
      Query.orderDesc("$createdAt"),
    ]);

    console.log("Tasks found for employee:", tasks.total);

    return c.json({ data: tasks });
  })
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { workspaceId, projectId, assigneeId, status } = c.req.query();

    if (!workspaceId) {
      return c.json({ error: "Missing workspaceId" }, 400);
    }

    // Check if user is admin or member of workspace
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
    
    if (!isAdmin) {
      // For employees, check if they are member of workspace
      const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
      ]);

      if (member.total === 0) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }

    const queries = [Query.equal("workspaceId", workspaceId)];

    if (projectId) {
      queries.push(Query.equal("projectId", projectId));
    }

    if (assigneeId) {
      queries.push(Query.equal("assigneeId", assigneeId));
    }

    if (status) {
      queries.push(Query.equal("status", status));
    }

    queries.push(Query.orderAsc("position"));

    const tasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, queries);

    return c.json({ data: tasks });
  })
  .post(
    "/",
    zValidator("json", createTaskSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { name, description, workspaceId, projectId, assigneeId, status, priority, dueDate } = c.req.valid("json");

      console.log("Creating task with assigneeId:", assigneeId);

      // If assigneeId is provided, ensure it's the employee document ID, not user ID
      let finalAssigneeId = assigneeId === "unassigned" ? "" : assigneeId;
      
      if (assigneeId && assigneeId !== "unassigned") {
        // Check if this is a user ID by trying to find the employee record
        const employeeByUserId = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
          Query.equal("userId", assigneeId),
        ]);
        
        if (employeeByUserId.total > 0) {
          // This was a user ID, convert to employee document ID
          finalAssigneeId = employeeByUserId.documents[0].$id;
          console.log("Converted user ID to employee document ID:", assigneeId, "->", finalAssigneeId);
        } else {
          // Check if this is already an employee document ID
          try {
            const existingEmployee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, assigneeId);
            finalAssigneeId = existingEmployee.$id;
            console.log("AssigneeId is already an employee document ID:", assigneeId);
          } catch (error) {
            console.log("Invalid assigneeId provided:", assigneeId, "Error:", error);
            finalAssigneeId = "";
          }
        }
      }

      // Check if user is admin - only admin can create tasks
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
      
      if (!isAdmin) {
        return c.json({ error: "Unauthorized. Only admin can create tasks." }, 403);
      }

      // Get highest position for new task
      const highestPositionTask = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("status", status),
          Query.equal("workspaceId", workspaceId),
          Query.orderDesc("position"),
          Query.limit(1),
        ]
      );

      const newPosition = highestPositionTask.documents.length > 0 
        ? highestPositionTask.documents[0].position + 1000 
        : 1000;

      console.log("Final assigneeId for task:", finalAssigneeId);

      const task = await databases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        {
          name,
          description: description || "",
          workspaceId,
          projectId: projectId || "",
          assigneeId: finalAssigneeId || "",
          status,
          priority,
          dueDate: dueDate ? dueDate.toISOString() : "",
          position: newPosition,
          assignedBy: finalAssigneeId ? user.$id : "",
          assignedDate: finalAssigneeId ? new Date().toISOString() : "",
        },
      );

      console.log("Task created with assigneeId:", task.assigneeId);

      return c.json({ data: task });
    },
  )
  .get("/:taskId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { taskId } = c.req.param();

    try {
      const task = await databases.getDocument(DATABASE_ID, TASKS_ID, taskId);
      
      // Check if user is admin or assigned to the task
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
      
      if (!isAdmin && task.assigneeId !== user.$id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: task });
    } catch (error) {
      return c.json({ error: "Task not found" }, 404);
    }
  })
  .patch(
    "/:taskId",
    sessionMiddleware,
    zValidator("json", updateTaskSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { taskId } = c.req.param();
      const { name, description, projectId, assigneeId, status, priority, dueDate, position } = c.req.valid("json");

      const existingTask = await databases.getDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId,
      );

      // Check if user is admin or member of workspace
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
      
      if (!isAdmin) {
        // For employees, check if they are member of workspace
        const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
          Query.equal("workspaceId", existingTask.workspaceId),
          Query.equal("userId", user.$id),
        ]);

        if (member.total === 0) {
          return c.json({ error: "Unauthorized" }, 401);
        }
      }

      // Check if assigneeId is being updated and track assignment
      const updateData: any = {
        name: name ?? existingTask.name,
        description: description ?? existingTask.description,
        projectId: projectId ?? existingTask.projectId,
        assigneeId: assigneeId ?? existingTask.assigneeId,
        status: status ?? existingTask.status,
        priority: priority ?? existingTask.priority,
        dueDate: dueDate ? dueDate.toISOString() : existingTask.dueDate,
        position: position ?? existingTask.position,
      };

      // If assigneeId is being changed and user is admin, track the assignment
      if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId && isAdmin) {
        updateData.assignedBy = user.$id;
        updateData.assignedDate = new Date().toISOString();
      }

      const task = await databases.updateDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId,
        updateData,
      );

      return c.json({ data: task });
    },
  )
  .delete("/:taskId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { taskId } = c.req.param();

    const existingTask = await databases.getDocument(
      DATABASE_ID,
      TASKS_ID,
      taskId,
    );

    // Check if user is admin or member of workspace
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@company.com";
    
    if (!isAdmin) {
      // For employees, check if they are member of workspace
      const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", existingTask.workspaceId),
        Query.equal("userId", user.$id),
      ]);

      if (member.total === 0) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);

    return c.json({ data: { $id: taskId } });
  });

export default app;
