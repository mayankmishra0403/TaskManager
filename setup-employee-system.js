const { Client, Databases, Users, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68d5009e001f31eed4a4')
    .setKey('standard_89575a6014e86df20d48a88ba17f669eddaf860fb51cd466a8a708ade58c84373b387b9a5a5df9e7823f45e65e56eb2f377fe120225f03d401dfd365deec7f6770a9238650509a1b7375722e6518c23c19973558c79add39acb0b19274923ed5e9abb3bbac76639efd059ec4d317c139a44d0a032221719c80b493a9cb6c740f');

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = '68d500f40016e65b5da6';

async function setupEmployeeSystem() {
    try {
        console.log('🔍 Setting up Employee Management System...\n');
        
        // List existing collections
        const collections = await databases.listCollections(DATABASE_ID);
        console.log('Existing collections:');
        collections.collections.forEach(collection => {
            console.log(`- ${collection.name} (ID: ${collection.$id})`);
        });
        console.log('\n');

        // Create employees collection
        let employeesCollection = collections.collections.find(c => c.name === 'employees');
        if (!employeesCollection) {
            console.log('🏗️  Creating employees collection...');
            employeesCollection = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                'employees',
                [
                    Permission.create(Role.any()),
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`✅ Employees collection created with ID: ${employeesCollection.$id}`);

            // Create attributes for employees
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'name', 255, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'email', 255, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'employeeId', 100, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'department', 255, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'workspaceId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'userId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, employeesCollection.$id, 'createdBy', 255, true);
            await databases.createBooleanAttribute(DATABASE_ID, employeesCollection.$id, 'isActive', true);
            
            console.log('✅ Employees attributes created');
        } else {
            console.log(`✅ Employees collection already exists: ${employeesCollection.$id}`);
        }

        // Update tasks collection to include better assignee tracking
        const tasksCollection = collections.collections.find(c => c.name === 'tasks' && c.$id === '68d6165c0006cbeffad1');
        if (tasksCollection) {
            console.log('🔧 Checking tasks collection attributes...');
            const taskAttributes = tasksCollection.attributes.map(attr => attr.key);
            
            if (!taskAttributes.includes('assignedBy')) {
                console.log('➕ Adding assignedBy attribute to tasks...');
                await databases.createStringAttribute(DATABASE_ID, tasksCollection.$id, 'assignedBy', 255, false);
                console.log('✅ AssignedBy attribute added to tasks');
            }
            
            if (!taskAttributes.includes('assignedDate')) {
                console.log('➕ Adding assignedDate attribute to tasks...');
                await databases.createDatetimeAttribute(DATABASE_ID, tasksCollection.$id, 'assignedDate', false);
                console.log('✅ AssignedDate attribute added to tasks');
            }
        }

        // Check if we need to create a default admin user
        console.log('\n👤 Checking for admin user...');
        try {
            const usersList = await users.list();
            const adminUser = usersList.users.find(user => user.email === 'admin@company.com');
            
            if (!adminUser) {
                console.log('👤 Creating default admin user...');
                const newAdmin = await users.create(
                    ID.unique(),
                    'admin@company.com',
                    undefined, // phone
                    'admin123', // password
                    'Admin User' // name
                );
                console.log(`✅ Admin user created with ID: ${newAdmin.$id}`);
                console.log('📧 Admin Email: admin@company.com');
                console.log('🔐 Admin Password: admin123');
            } else {
                console.log('✅ Admin user already exists');
                console.log('📧 Admin Email: admin@company.com');
            }
        } catch (error) {
            console.log('ℹ️  Admin user management handled by auth system');
        }

        console.log('\n🎉 Employee Management System setup completed!\n');
        console.log('📝 Add this to your .env.local file:');
        console.log(`NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID=${employeesCollection.$id}`);
        console.log('\n👤 Default Admin Credentials:');
        console.log('Email: admin@company.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error setting up employee system:', error);
    }
}

setupEmployeeSystem();
