require('dotenv').config({ path: '.env.local' });

const { Client, Databases } = require('node-appwrite');

async function checkTasksCollection() {
  console.log('📋 Checking tasks collection attributes...');
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
  const tasksId = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID;

  try {
    const collection = await databases.getCollection(databaseId, tasksId);
    console.log(`Collection: ${collection.name}`);
    console.log(`Total attributes: ${collection.attributes.length}`);
    console.log('Attributes:');
    collection.attributes.forEach((attr, index) => {
      console.log(`  ${index + 1}. ${attr.key} (${attr.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTasksCollection();
