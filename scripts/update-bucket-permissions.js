require('dotenv').config({ path: '.env.local' });

const { Client, Storage, Permission, Role } = require('node-appwrite');

async function updateBucketPermissions() {
  console.log('Updating bucket permissions...');
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const storage = new Storage(client);
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID;
  
  try {
    // Get current bucket info
    const bucket = await storage.getBucket(bucketId);
    console.log('Current bucket info:');
    console.log('- Name:', bucket.name);
    console.log('- Permissions:', bucket.permissions);
    console.log('- File Security:', bucket.fileSecurity);
    
    // Update bucket permissions to allow public read access
    const updatedBucket = await storage.updateBucket(
      bucketId,
      bucket.name,
      [
        Permission.read(Role.any()), // Allow anyone to read files
        Permission.create(Role.users()), // Only authenticated users can create files
        Permission.update(Role.users()), // Only authenticated users can update files
        Permission.delete(Role.users())  // Only authenticated users can delete files
      ],
      false, // fileSecurity disabled - use bucket-level permissions
      bucket.enabled,
      bucket.maximumFileSize,
      bucket.allowedFileExtensions,
      bucket.compression,
      bucket.encryption,
      bucket.antivirus
    );
    
    console.log('✅ Bucket permissions updated successfully!');
    console.log('New permissions:', updatedBucket.permissions);
    
  } catch (error) {
    console.error('❌ Error updating bucket permissions:', error.message);
  }
}

updateBucketPermissions();
