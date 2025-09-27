require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

// Configuration
const client = new Client();
const databases = new Databases(client);

// Set your Appwrite endpoint and project
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.NEXT_APPWRITE_KEY);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

async function fixNotificationAttributes() {
  try {
    console.log('Fixing notification attributes...');

    // Create isRead boolean attribute (not required, no default)
    try {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        'notifications',
        'isRead',
        false, // not required
        undefined, // no default
        false // not array
      );
      console.log('✓ Created isRead attribute');
    } catch (error) {
      console.log('isRead attribute already exists or error:', error.message);
    }

    // Add delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create priority enum attribute (not required, no default)
    try {
      await databases.createEnumAttribute(
        DATABASE_ID,
        'notifications',
        'priority',
        ['low', 'medium', 'high'],
        false, // not required
        undefined, // no default
        false // not array
      );
      console.log('✓ Created priority attribute');
    } catch (error) {
      console.log('priority attribute already exists or error:', error.message);
    }

    // Add delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create missing index for isRead
    try {
      await databases.createIndex(
        DATABASE_ID,
        'notifications',
        'isRead_idx',
        'key',
        ['isRead']
      );
      console.log('✓ Created isRead index');
    } catch (error) {
      console.log('isRead index already exists or error:', error.message);
    }

    console.log('✅ Notification attributes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing notification attributes:', error);
    process.exit(1);
  }
}

// Run the fix
fixNotificationAttributes();
