const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

async function updateEmployeeCollection() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
  const employeesId = process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID;

  try {
    console.log('📋 Checking employee collection attributes...');
    
    // Get current collection attributes
    const collection = await databases.getCollection(databaseId, employeesId);
    console.log('Current attributes:');
    collection.attributes.forEach(attr => {
      console.log(`  - ${attr.key}: ${attr.type}`);
    });

    // Check if profilePhotoId already exists
    const hasProfilePhotoId = collection.attributes.some(attr => attr.key === 'profilePhotoId');
    const hasProfilePhotoUrl = collection.attributes.some(attr => attr.key === 'profilePhotoUrl');

    if (!hasProfilePhotoId) {
      console.log('📝 Adding profilePhotoId attribute...');
      await databases.createStringAttribute(
        databaseId,
        employeesId,
        'profilePhotoId',
        255,
        false // not required
      );
      console.log('✅ profilePhotoId attribute created');
    } else {
      console.log('👍 profilePhotoId attribute already exists');
    }

    if (!hasProfilePhotoUrl) {
      console.log('📝 Adding profilePhotoUrl attribute...');
      await databases.createUrlAttribute(
        databaseId,
        employeesId,
        'profilePhotoUrl',
        false // not required
      );
      console.log('✅ profilePhotoUrl attribute created');
    } else {
      console.log('👍 profilePhotoUrl attribute already exists');
    }

    console.log('🎉 Employee collection schema updated successfully!');

  } catch (error) {
    console.error('❌ Error updating employee collection:', error.message);
    process.exit(1);
  }
}

// Run the update
updateEmployeeCollection().then(() => {
  console.log('🏁 Schema update completed!');
  process.exit(0);
});
