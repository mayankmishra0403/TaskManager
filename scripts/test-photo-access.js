require('dotenv').config({ path: '.env.local' });

const { Client, Databases, Storage } = require('node-appwrite');

async function testPhotoAccess() {
  console.log('Testing photo access...');
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);
  
  try {
    // Get the employee with photo
    const employees = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID,
      []
    );
    
    console.log('Found employees:');
    employees.documents.forEach(emp => {
      console.log(`- ${emp.name}: photoId=${emp.profilePhotoId}, photoUrl=${emp.profilePhotoUrl}`);
    });
    
    // Find employee with photo
    const employeeWithPhoto = employees.documents.find(emp => emp.profilePhotoId);
    
    if (employeeWithPhoto) {
      console.log('\nEmployee with photo found:', employeeWithPhoto.name);
      console.log('Photo ID:', employeeWithPhoto.profilePhotoId);
      console.log('Photo URL:', employeeWithPhoto.profilePhotoUrl);
      
      // Try to get file info
      try {
        const file = await storage.getFile(
          process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID,
          employeeWithPhoto.profilePhotoId
        );
        console.log('File info:', {
          name: file.name,
          size: file.sizeOriginal,
          mimeType: file.mimeType
        });
      } catch (fileError) {
        console.error('Error getting file info:', fileError.message);
      }
      
    } else {
      console.log('\nNo employees with photos found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhotoAccess();
