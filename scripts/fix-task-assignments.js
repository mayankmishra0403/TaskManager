require('dotenv').config({ path: '.env.local' });

const { Client, Databases } = require('node-appwrite');

async function fixTaskAssignments() {
  console.log('🔧 Fixing task assignments...');
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
  const tasksId = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID;
  const employeesId = process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID;

  try {
    // Get all tasks
    const tasks = await databases.listDocuments(databaseId, tasksId, []);
    console.log(`Found ${tasks.total} tasks`);

    // Get all employees
    const employees = await databases.listDocuments(databaseId, employeesId, []);
    console.log(`Found ${employees.total} employees`);

    // Create mapping from userId to employee document ID
    const userIdToEmployeeId = new Map();
    employees.documents.forEach(emp => {
      userIdToEmployeeId.set(emp.userId, emp.$id);
    });

    let fixedCount = 0;

    for (const task of tasks.documents) {
      if (!task.assigneeId) continue; // Skip unassigned tasks

      // Check if assigneeId is a user ID that needs to be converted to employee document ID
      const employeeDocId = userIdToEmployeeId.get(task.assigneeId);
      
      if (employeeDocId && employeeDocId !== task.assigneeId) {
        console.log(`Fixing task "${task.name}": ${task.assigneeId} -> ${employeeDocId}`);
        
        await databases.updateDocument(
          databaseId,
          tasksId,
          task.$id,
          { assigneeId: employeeDocId }
        );
        
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} task assignments`);

    if (fixedCount === 0) {
      console.log('👍 All task assignments are already correct');
    }

  } catch (error) {
    console.error('❌ Error fixing task assignments:', error.message);
    process.exit(1);
  }
}

fixTaskAssignments();
