require('dotenv').config({ path: '.env.local' });

const { Client, Databases } = require('node-appwrite');

async function addMultipleAssigneesSupport() {
  console.log('📝 Adding multiple assignees support to tasks collection...');
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
  const tasksId = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID;

  try {
    // Get current collection attributes
    const collection = await databases.getCollection(databaseId, tasksId);
    console.log('📋 Checking tasks collection attributes...');
    
    const hasAssigneeIds = collection.attributes.some(attr => attr.key === 'assigneeIds');

    if (!hasAssigneeIds) {
      console.log('➕ Adding assigneeIds attribute to tasks collection...');
      await databases.createStringAttribute(
        databaseId,
        tasksId,
        'assigneeIds',
        10000, // Large size to store JSON array of IDs
        false // not required
      );
      console.log('✅ assigneeIds attribute added successfully');
    } else {
      console.log('👍 assigneeIds attribute already exists');
    }

    console.log('🎉 Multiple assignees support added successfully!');
    console.log('📄 Tasks can now be assigned to multiple employees simultaneously');

  } catch (error) {
    console.error('❌ Error adding multiple assignees support:', error.message);
    process.exit(1);
  }
}

addMultipleAssigneesSupport();
