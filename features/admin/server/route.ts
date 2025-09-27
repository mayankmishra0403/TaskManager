import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { Query } from "node-appwrite";
import {
  DATABASE_ID,
  EMPLOYEES_ID,
  TASKS_ID,
  PROJECTS_ID,
} from "@/config";

const app = new Hono()
  .get("/employees", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Check if user is admin
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can view all employees." }, 403);
    }

    // Get all employees across all workspaces
    const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
      Query.orderDesc("$createdAt"),
    ]);

    console.log("Admin employees API returning:", employees.documents.map(emp => ({ 
      name: emp.name, 
      documentId: emp.$id, 
      userId: emp.userId 
    })));

    return c.json({ data: employees });
  })
  .get("/tasks", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Allow both admin and employees to view all tasks (for dashboard)
    // Admin can manage tasks, employees can view all tasks but not modify them
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";

    // Get all tasks across all workspaces
    const tasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.orderDesc("$createdAt"),
    ]);

    // Get all employees to map assigneeId to employee details
    const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, []);
    
    // Create a map of both employee document ID and user ID to employee details
    const employeeMap = new Map();
    const userIdToEmployeeMap = new Map();
    employees.documents.forEach(emp => {
      const empDetails = {
        name: emp.name,
        email: emp.email,
        userId: emp.userId
      };
      employeeMap.set(emp.$id, empDetails);
      userIdToEmployeeMap.set(emp.userId, empDetails);
    });

    // Enhance tasks with assignee information
    const enhancedTasks = {
      ...tasks,
      documents: tasks.documents.map(task => {
        let assignees = [];
        
        if (task.assigneeId) {
          try {
            // Check if it's a JSON array (multiple assignees)
            const parsedIds = JSON.parse(task.assigneeId);
            if (Array.isArray(parsedIds)) {
              // Multiple assignees
              assignees = parsedIds.map(id => employeeMap.get(id)).filter(Boolean);
            } else {
              // Single assignee stored as JSON
              const employee = employeeMap.get(parsedIds);
              if (employee) assignees = [employee];
            }
          } catch {
            // Single assignee (not JSON) - backward compatibility
            const employee = employeeMap.get(task.assigneeId) || userIdToEmployeeMap.get(task.assigneeId);
            if (employee) assignees = [employee];
          }
        }
        
        return {
          ...task,
          assignee: assignees.length === 1 ? assignees[0] : null, // For backward compatibility
          assignees: assignees, // Multiple assignees
          assigneeNames: assignees.map(emp => emp.name).join(', ') || 'Unassigned'
        };
      })
    };

    // Debug: Log task assignments for admin visibility
    console.log("Admin tasks API - Task assignments:", enhancedTasks.documents.map(task => ({
      name: (task as any).name,
      assigneeId: (task as any).assigneeId,
      assigneeNames: (task as any).assigneeNames,
      assigneeCount: (task as any).assignees.length,
      status: (task as any).status
    })));

    return c.json({ data: enhancedTasks });
  })
  .get("/projects", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    // Check if user is admin
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can view all projects." }, 403);
    }

    // Get all projects across all workspaces
    const projects = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
      Query.orderDesc("$createdAt"),
    ]);

    return c.json({ data: projects });
  })
  .patch("/tasks/:taskId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { taskId } = c.req.param();
    
    // Check if user is admin
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can update tasks." }, 403);
    }

    const { name, description, status, priority, assigneeId, dueDate } = await c.req.json();

    try {
      // Prepare update data
      const updateData: any = {
        name,
        status,
        priority,
      };

      if (description !== undefined) {
        updateData.description = description;
      }

      if (assigneeId !== undefined && assigneeId !== "unassigned") {
        // Convert user ID to employee document ID if needed
        let finalAssigneeId = assigneeId;
        
        // Check if this is a user ID by trying to find the employee record
        const employeeByUserId = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
          Query.equal("userId", assigneeId),
        ]);
        
        if (employeeByUserId.total > 0) {
          // This was a user ID, convert to employee document ID
          finalAssigneeId = employeeByUserId.documents[0].$id;
          console.log("Admin update - Converted user ID to employee document ID:", assigneeId, "->", finalAssigneeId);
        } else {
          // Check if this is already an employee document ID
          try {
            const existingEmployee = await databases.getDocument(DATABASE_ID, EMPLOYEES_ID, assigneeId);
            finalAssigneeId = existingEmployee.$id;
            console.log("Admin update - AssigneeId is already an employee document ID:", assigneeId);
          } catch (error) {
            console.log("Admin update - Invalid assigneeId provided:", assigneeId);
            finalAssigneeId = "";
          }
        }
        
        updateData.assigneeId = finalAssigneeId;
      } else if (assigneeId === "unassigned") {
        updateData.assigneeId = null;
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDate;
      }

      const task = await databases.updateDocument(
        DATABASE_ID,
        TASKS_ID,
        taskId,
        updateData
      );

      return c.json({ data: task });
    } catch (error) {
      console.error("Error updating task:", error);
      return c.json({ error: "Failed to update task" }, 400);
    }
  })
  .post("/fix-tasks", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    
    // Check if user is admin
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      return c.json({ error: "Unauthorized. Only admin can fix tasks." }, 403);
    }

    try {
      // Get all tasks
      const tasks = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
        Query.orderDesc("$createdAt"),
      ]);

      // Get all employees
      const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, []);
      
      let fixedCount = 0;
      const results = [];

      for (const task of tasks.documents) {
        if (!task.assigneeId) continue; // Skip unassigned tasks
        
        // Find employee by userId (if assigneeId is currently a user ID)
        const employeeByUserId = employees.documents.find(emp => emp.userId === task.assigneeId);
        
        if (employeeByUserId && employeeByUserId.$id !== task.assigneeId) {
          // This task has a user ID instead of employee document ID, fix it
          console.log(`Fixing task "${task.name}": ${task.assigneeId} -> ${employeeByUserId.$id}`);
          
          const updatedTask = await databases.updateDocument(
            DATABASE_ID,
            TASKS_ID,
            task.$id,
            { assigneeId: employeeByUserId.$id }
          );
          
          fixedCount++;
          results.push({
            taskName: task.name,
            oldAssigneeId: task.assigneeId,
            newAssigneeId: employeeByUserId.$id,
            employeeName: employeeByUserId.name
          });
        }
      }

      console.log(`Fixed ${fixedCount} tasks with incorrect assigneeId values`);
      
      return c.json({ 
        message: `Fixed ${fixedCount} tasks`, 
        results,
        totalTasks: tasks.documents.length 
      });
    } catch (error) {
      console.error("Error fixing tasks:", error);
      return c.json({ error: "Failed to fix tasks" }, 500);
    }
  });

export default app;
