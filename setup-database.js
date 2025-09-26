const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68d5009e001f31eed4a4')
    .setKey('standard_89575a6014e86df20d48a88ba17f669eddaf860fb51cd466a8a708ade58c84373b387b9a5a5df9e7823f45e65e56eb2f377fe120225f03d401dfd365deec7f6770a9238650509a1b7375722e6518c23c19973558c79add39acb0b19274923ed5e9abb3bbac76639efd059ec4d317c139a44d0a032221719c80b493a9cb6c740f');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '68d500f40016e65b5da6';

async function setupDatabase() {
    try {
        console.log('🔍 Checking existing collections...\n');
        
        // List existing collections
        const collections = await databases.listCollections(DATABASE_ID);
        console.log('Existing collections:');
        collections.collections.forEach(collection => {
            console.log(`- ${collection.name} (ID: ${collection.$id})`);
        });
        console.log('\n');

        // Check if workspaces collection exists
        let workspacesCollection = collections.collections.find(c => c.name === 'workspaces');
        if (!workspacesCollection) {
            console.log('🏗️  Creating workspaces collection...');
            workspacesCollection = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                'workspaces',
                [
                    Permission.create(Role.any()),
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`✅ Workspaces collection created with ID: ${workspacesCollection.$id}`);

            // Create attributes for workspaces
            await databases.createStringAttribute(DATABASE_ID, workspacesCollection.$id, 'name', 255, true);
            await databases.createStringAttribute(DATABASE_ID, workspacesCollection.$id, 'userId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, workspacesCollection.$id, 'imageUrl', 2048, false);
            await databases.createStringAttribute(DATABASE_ID, workspacesCollection.$id, 'inviteCode', 10, true);
            
            console.log('✅ Workspaces attributes created');
        } else {
            console.log(`✅ Workspaces collection already exists: ${workspacesCollection.$id}`);
        }

        // Check if members collection exists
        let membersCollection = collections.collections.find(c => c.name === 'members');
        if (!membersCollection) {
            console.log('🏗️  Creating members collection...');
            membersCollection = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                'members',
                [
                    Permission.create(Role.any()),
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`✅ Members collection created with ID: ${membersCollection.$id}`);

            // Create attributes for members
            await databases.createStringAttribute(DATABASE_ID, membersCollection.$id, 'userId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, membersCollection.$id, 'workspaceId', 255, true);
            await databases.createEnumAttribute(DATABASE_ID, membersCollection.$id, 'role', ['ADMIN', 'MEMBER'], true);
            
            console.log('✅ Members attributes created');
        } else {
            console.log(`✅ Members collection already exists: ${membersCollection.$id}`);
        }

        // Check if tasks collection exists (for future use)
        let tasksCollection = collections.collections.find(c => c.name === 'tasks');
        if (!tasksCollection) {
            console.log('🏗️  Creating tasks collection...');
            tasksCollection = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                'tasks',
                [
                    Permission.create(Role.any()),
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`✅ Tasks collection created with ID: ${tasksCollection.$id}`);

            // Create attributes for tasks
            await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'name', 255, true);
            await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'description', 5000, false);
            await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'workspaceId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'projectId', 255, false);
            await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'assigneeId', 255, false);
            await databases.createEnumAttribute(DATABASE_ID, tasksCollection.$id, 'status', ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'], true);
            await databases.createEnumAttribute(DATABASE_ID, tasksCollection.$id, 'priority', ['LOW', 'MEDIUM', 'HIGH'], true);
            await databases.createDatetimeAttribute(DATABASE_ID, tasksCollection.$id, 'dueDate', false);
            await databases.createIntegerAttribute(DATABASE_ID, tasksCollection.$id, 'position', true);
            
            console.log('✅ Tasks attributes created');
        } else {
            console.log(`✅ Tasks collection already exists: ${tasksCollection.$id}`);
        }

        // Check if projects collection exists (for future use)
        let projectsCollection = collections.collections.find(c => c.name === 'projects');
        if (!projectsCollection) {
            console.log('🏗️  Creating projects collection...');
            projectsCollection = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                'projects',
                [
                    Permission.create(Role.any()),
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`✅ Projects collection created with ID: ${projectsCollection.$id}`);

            // Create attributes for projects
            await databases.createStringAttribute(DATABASE_ID, projectsCollection.$id, 'name', 255, true);
            await databases.createStringAttribute(DATABASE_ID, projectsCollection.$id, 'description', 5000, false);
            await databases.createStringAttribute(DATABASE_ID, projectsCollection.$id, 'workspaceId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, projectsCollection.$id, 'imageUrl', 2048, false);
            
            console.log('✅ Projects attributes created');
        } else {
            console.log(`✅ Projects collection already exists: ${projectsCollection.$id}`);
        }

        console.log('\n🎉 Database setup completed!\n');
        console.log('📝 Update your .env.local file with these collection IDs:');
        console.log(`NEXT_PUBLIC_APPWRITE_WORKSPACES_ID=${workspacesCollection.$id}`);
        console.log(`NEXT_PUBLIC_APPWRITE_MEMBERS_ID=${membersCollection.$id}`);
        console.log(`NEXT_PUBLIC_APPWRITE_TASKS_ID=${tasksCollection.$id}`);
        console.log(`NEXT_PUBLIC_APPWRITE_PROJECTS_ID=${projectsCollection.$id}`);

    } catch (error) {
        console.error('❌ Error setting up database:', error);
    }
}

setupDatabase();
