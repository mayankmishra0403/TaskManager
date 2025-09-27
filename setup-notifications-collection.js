require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuration
const client = new Client();
const databases = new Databases(client);

// Set your Appwrite endpoint and project
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.NEXT_APPWRITE_KEY);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

async function createNotificationsCollection() {
  try {
    console.log('Creating notifications collection...');
    console.log('DATABASE_ID:', DATABASE_ID);

    // Create the notifications collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      'notifications',
      'Notifications',
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );

    console.log('Notifications collection created:', collection.$id);

    // Create attributes
    const attributes = [
      {
        key: 'title',
        type: 'string',
        size: 255,
        required: true,
        array: false,
      },
      {
        key: 'message',
        type: 'string',
        size: 2000,
        required: true,
        array: false,
      },
      {
        key: 'type',
        type: 'enum',
        elements: ['task_assigned', 'admin_message', 'task_update', 'general'],
        required: true,
        array: false,
      },
      {
        key: 'recipientIds',
        type: 'string',
        size: 5000, // JSON array stored as string
        required: true,
        array: false,
      },
      {
        key: 'isRead',
        type: 'boolean',
        required: true,
        default: false,
        array: false,
      },
      {
        key: 'workspaceId',
        type: 'string',
        size: 36,
        required: true,
        array: false,
      },
      {
        key: 'createdBy',
        type: 'string',
        size: 36,
        required: true,
        array: false,
      },
      {
        key: 'taskId',
        type: 'string',
        size: 36,
        required: false,
        array: false,
      },
      {
        key: 'priority',
        type: 'enum',
        elements: ['low', 'medium', 'high'],
        required: true,
        default: 'medium',
        array: false,
      },
    ];

    // Create each attribute
    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'notifications',
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            'notifications',
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(
            DATABASE_ID,
            'notifications',
            attr.key,
            attr.elements,
            attr.required,
            attr.default,
            attr.array
          );
        }
        
        console.log(`✓ Created attribute: ${attr.key}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error creating attribute ${attr.key}:`, error.message);
      }
    }

    // Create indexes for better query performance
    console.log('Creating indexes...');
    
    const indexes = [
      {
        key: 'workspaceId_idx',
        type: 'key',
        attributes: ['workspaceId'],
      },
      {
        key: 'isRead_idx',
        type: 'key',
        attributes: ['isRead'],
      },
      {
        key: 'type_idx',
        type: 'key',
        attributes: ['type'],
      },
      {
        key: 'createdAt_idx',
        type: 'key',
        attributes: ['$createdAt'],
        orders: ['desc'],
      },
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          DATABASE_ID,
          'notifications',
          index.key,
          index.type,
          index.attributes,
          index.orders
        );
        console.log(`✓ Created index: ${index.key}`);
        
        // Add delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error creating index ${index.key}:`, error.message);
      }
    }

    console.log('✅ Notifications collection setup completed successfully!');
    console.log('\nCollection Details:');
    console.log('- Collection ID: notifications');
    console.log('- Database ID:', DATABASE_ID);
    console.log('- Attributes: title, message, type, recipientIds, isRead, workspaceId, createdBy, taskId, priority');
    console.log('- Indexes: workspaceId, isRead, type, $createdAt');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up notifications collection:', error);
    process.exit(1);
  }
}

// Run the setup
createNotificationsCollection();
