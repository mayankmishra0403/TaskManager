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
    console.log("Employee found:", employee.name, "Employee ID:", employee.$id, "WorkspaceId:", employee.workspaceId);

    // Fetch all tasks and filter by assignment (handles both single and multi-assignee JSON)
    const allTasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.orderDesc("$createdAt"),
      Query.limit(1000),
    ]);

    console.log("Total tasks fetched:", allTasks.total);

    const assigned = allTasks.documents.filter((t: any) => {
      const a = t.assigneeId as string | undefined;
      console.log("Checking task:", t.name, "assigneeId:", a);
      
      if (!a) return false;
      
      if (a.startsWith("[")) {
        try {
          const ids = JSON.parse(a) as string[];
          const isAssigned = ids.includes(employee.$id);
          console.log("Multi-assignee task:", t.name, "ids:", ids, "employee match:", isAssigned);
          return isAssigned;
        } catch {
          return false;
        }
      }
      
      const isAssigned = a === employee.$id;
      console.log("Single-assignee task:", t.name, "match:", isAssigned);
      return isAssigned;
    });

    console.log("Tasks found for employee (filtered):", assigned.length);

    return c.json({ data: { documents: assigned, total: assigned.length } });
  })
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { workspaceId, projectId, assigneeId, status } = c.req.query();

    if (!workspaceId) {
      return c.json({ error: "Missing workspaceId" }, 400);
    }

    // Check if user is admin or member of workspace
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
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

      const { name, description, workspaceId, projectId, assigneeId, assigneeIds, status, priority, dueDate } = c.req.valid("json");

      console.log("Creating task with assigneeId:", assigneeId, "assigneeIds:", assigneeIds);

      // Handle multiple assignees - priority: assigneeIds > assigneeId
      let finalAssigneeId = "";
      
      if (assigneeIds && assigneeIds.length > 0) {
        // Multiple assignees - store as JSON string
        const validEmployeeIds = [];
        
        for (const id of assigneeIds) {
          if (id && id !== "unassigned") {
            // Check if this is a user ID by trying to find the employee record
            const employeeByUserId = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
              Query.equal("userId", id),
            ]);
            
            if (employeeByUserId.total > 0) {
              validEmployeeIds.push(employeeByUserId.documents[0].$id);
            } else {
              // Check if this is already an employee document ID
              try {
                const existingEmployee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, id);
                validEmployeeIds.push(existingEmployee.$id);
              } catch (error) {
                console.log("Invalid assigneeId in array:", id);
              }
            }
          }
        }
        
        if (validEmployeeIds.length > 0) {
          // Store multiple assignees as JSON string
          finalAssigneeId = JSON.stringify(validEmployeeIds);
          console.log("Multiple assignees stored:", finalAssigneeId);
        }
      } else if (assigneeId && assigneeId !== "unassigned") {
        // Single assignee - backward compatibility
        const employeeByUserId = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
          Query.equal("userId", assigneeId),
        ]);
        
        if (employeeByUserId.total > 0) {
          finalAssigneeId = employeeByUserId.documents[0].$id;
          console.log("Converted user ID to employee document ID:", assigneeId, "->", finalAssigneeId);
        } else {
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
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
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

      // Send notification for task assignment
      if (finalAssigneeId) {
        try {
          let recipientUserIds = [];
          
          // Handle multiple assignees stored as JSON
          if (finalAssigneeId.startsWith("[")) {
            const employeeIds = JSON.parse(finalAssigneeId);
            
            // Convert employee IDs to user IDs
            for (const empId of employeeIds) {
              try {
                const employee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, empId);
                if (employee.userId) {
                  recipientUserIds.push(employee.userId);
                }
              } catch (error) {
                console.error("Error fetching employee for notification:", empId, error);
              }
            }
          } else {
            // Single assignee
            try {
              const employee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, finalAssigneeId);
              if (employee.userId) {
                recipientUserIds.push(employee.userId);
              }
            } catch (error) {
              console.error("Error fetching employee for notification:", finalAssigneeId, error);
            }
          }

          // Create notification if we have recipients
      if (recipientUserIds.length > 0) {
            await databases.createDocument(
              DATABASE_ID,
              "notifications",
              ID.unique(),
              {
                title: "New Task Assigned",
                message: `You have been assigned a new task: "${name}"`,
                type: "task_assigned",
        recipientIds: JSON.stringify(recipientUserIds),
                workspaceId,
                createdBy: user.$id,
                taskId: task.$id,
                priority: priority === "HIGH" ? "high" : priority === "MEDIUM" ? "medium" : "low",
                isRead: false,
              }
            );
            console.log("Task assignment notification sent to:", recipientUserIds);
          }
        } catch (error) {
          console.error("Error sending task assignment notification:", error);
          // Don't fail the task creation if notification fails
        }
      }

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
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      if (!isAdmin) {
        // Resolve current user's employee ID
        const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
          Query.equal("userId", user.$id),
        ]);

        if (employees.total === 0) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const employeeId = employees.documents[0].$id;

        let isAssigned = false;
        if (typeof task.assigneeId === "string" && task.assigneeId) {
          if (task.assigneeId.startsWith("[")) {
            try {
              const ids = JSON.parse(task.assigneeId) as string[];
              isAssigned = ids.includes(employeeId);
            } catch (_) {
              isAssigned = false;
            }
          } else {
            isAssigned = task.assigneeId === employeeId;
          }
        }

        if (!isAssigned) {
          return c.json({ error: "Unauthorized" }, 401);
        }
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
      const { name, description, projectId, assigneeId, assigneeIds, status, priority, dueDate, position } = c.req.valid("json");

      const existingTask = await databases.getDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId,
      );

      // Check if user is admin or member of workspace
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
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

      // Handle multiple assignees update
      let finalAssigneeId = existingTask.assigneeId;
      
      if (assigneeIds && assigneeIds.length > 0) {
        // Multiple assignees provided - convert and store as JSON
        const validEmployeeIds = [];
        
        for (const id of assigneeIds) {
          if (id && id !== "unassigned") {
            try {
              const existingEmployee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, id);
              validEmployeeIds.push(existingEmployee.$id);
            } catch (error) {
              console.log("Invalid assigneeId in update array:", id);
            }
          }
        }
        
        finalAssigneeId = validEmployeeIds.length > 0 ? JSON.stringify(validEmployeeIds) : "";
        console.log("Updated multiple assignees:", finalAssigneeId);
      } else if (assigneeId !== undefined) {
        // Single assignee update (backward compatibility)
        if (assigneeId === "" || assigneeId === "unassigned") {
          finalAssigneeId = "";
        } else {
          try {
            const existingEmployee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, assigneeId);
            finalAssigneeId = existingEmployee.$id;
          } catch (error) {
            console.log("Invalid assigneeId in update:", assigneeId);
            finalAssigneeId = "";
          }
        }
      }

      const updateData: any = {
        name: name ?? existingTask.name,
        description: description ?? existingTask.description,
        projectId: projectId ?? existingTask.projectId,
        assigneeId: finalAssigneeId,
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

      // If assignment changed and we have a new assignee, notify them
      try {
        const assignmentChanged = !!finalAssigneeId && finalAssigneeId !== existingTask.assigneeId;
        if (assignmentChanged) {
          let recipientUserIds: string[] = [];

          if (typeof finalAssigneeId === 'string' && finalAssigneeId.startsWith("[")) {
            // Multiple assignees stored as JSON string of employee IDs
            const employeeIds = JSON.parse(finalAssigneeId) as string[];
            for (const empId of employeeIds) {
              try {
                const employee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, empId);
                if (employee.userId) recipientUserIds.push(employee.userId);
              } catch (error) {
                console.error("Error fetching employee for notification (update):", empId, error);
              }
            }
          } else if (typeof finalAssigneeId === 'string' && finalAssigneeId) {
            // Single assignee employee ID
            try {
              const employee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, finalAssigneeId);
              if (employee.userId) recipientUserIds.push(employee.userId);
            } catch (error) {
              console.error("Error fetching employee for notification (update):", finalAssigneeId, error);
            }
          }

          if (recipientUserIds.length > 0) {
            await databases.createDocument(
              DATABASE_ID,
              "notifications",
              ID.unique(),
              {
                title: "New Task Assigned",
                message: `You have been assigned a new task: "${updateData.name || existingTask.name}"`,
                type: "task_assigned",
                recipientIds: JSON.stringify(recipientUserIds),
                workspaceId: existingTask.workspaceId,
                createdBy: user.$id,
                taskId: task.$id,
                priority: (updateData.priority || existingTask.priority) === "HIGH" ? "high" : (updateData.priority || existingTask.priority) === "MEDIUM" ? "medium" : "low",
                isRead: false,
              }
            );
            console.log("Task assignment notification sent (update) to:", recipientUserIds);
          }
        }
      } catch (error) {
        console.error("Error sending task assignment notification on update:", error);
      }

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

    // Only admins can delete tasks
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can delete tasks." }, 403);
    }

    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);

    return c.json({ data: { $id: taskId } });
  });

export default app;
