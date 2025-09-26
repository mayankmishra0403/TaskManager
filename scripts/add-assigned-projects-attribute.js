const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Database setup script to add assignedProjects attribute
async function addAssignedProjectsAttribute() {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
      .setKey(process.env.APPWRITE_API_KEY); // You'll need to set this API key

    const databases = new Databases(client);

    console.log('Adding assignedProjects attribute to employees collection...');
    
    await databases.createStringAttribute(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID,
      'assignedProjects',
      500, // Size - increased for multiple project IDs
      false, // Not required
      undefined, // No default value
      true // Array = true
    );

    console.log('✅ assignedProjects attribute added successfully!');
    console.log('You can now uncomment the project assignment code.');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️  assignedProjects attribute already exists!');
    } else {
      console.error('❌ Error adding attribute:', error);
      console.log('Please check your environment variables and API key.');
    }
  }
}

// Run the script
addAssignedProjectsAttribute();
