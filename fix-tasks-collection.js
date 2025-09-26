const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68d5009e001f31eed4a4')
    .setKey('standard_89575a6014e86df20d48a88ba17f669eddaf860fb51cd466a8a708ade58c84373b387b9a5a5df9e7823f45e65e56eb2f377fe120225f03d401dfd365deec7f6770a9238650509a1b7375722e6518c23c19973558c79add39acb0b19274923ed5e9abb3bbac76639efd059ec4d317c139a44d0a032221719c80b493a9cb6c740f');

const databases = new Databases(client);

const DATABASE_ID = '68d500f40016e65b5da6';
const TASKS_COLLECTION_ID = '68d6165c0006cbeffad1';

async function fixTasksCollection() {
    try {
        console.log('🔍 Checking existing attributes in tasks collection...\n');
        
        // Get collection details
        const collection = await databases.getCollection(DATABASE_ID, TASKS_COLLECTION_ID);
        console.log('Collection:', collection.name);
        console.log('Existing attributes:');
        collection.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type})`);
        });
        console.log('\n');

        // Add missing attributes
        const existingAttributeKeys = collection.attributes.map(attr => attr.key);
        
        if (!existingAttributeKeys.includes('status')) {
            console.log('➕ Adding status attribute...');
            await databases.createEnumAttribute(
                DATABASE_ID, 
                TASKS_COLLECTION_ID, 
                'status', 
                ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'], 
                true
            );
            console.log('✅ Status attribute added');
        } else {
            console.log('✅ Status attribute already exists');
        }

        if (!existingAttributeKeys.includes('priority')) {
            console.log('➕ Adding priority attribute...');
            await databases.createEnumAttribute(
                DATABASE_ID, 
                TASKS_COLLECTION_ID, 
                'priority', 
                ['LOW', 'MEDIUM', 'HIGH'], 
                true
            );
            console.log('✅ Priority attribute added');
        } else {
            console.log('✅ Priority attribute already exists');
        }

        if (!existingAttributeKeys.includes('position')) {
            console.log('➕ Adding position attribute...');
            await databases.createIntegerAttribute(
                DATABASE_ID, 
                TASKS_COLLECTION_ID, 
                'position', 
                true
            );
            console.log('✅ Position attribute added');
        } else {
            console.log('✅ Position attribute already exists');
        }

        if (!existingAttributeKeys.includes('dueDate')) {
            console.log('➕ Adding dueDate attribute...');
            await databases.createDatetimeAttribute(
                DATABASE_ID, 
                TASKS_COLLECTION_ID, 
                'dueDate', 
                false
            );
            console.log('✅ DueDate attribute added');
        } else {
            console.log('✅ DueDate attribute already exists');
        }

        console.log('\n🎉 Tasks collection attributes fixed!');

    } catch (error) {
        console.error('❌ Error fixing tasks collection:', error);
    }
}

fixTasksCollection();
