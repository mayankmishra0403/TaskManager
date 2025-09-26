const { Client, Storage, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

async function setupStorageBucket() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  const storage = new Storage(client);
  // Use existing images bucket or create a new employee photos bucket
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID || 'employee-photos';

  try {
    // Try to get the bucket first
    try {
      const bucket = await storage.getBucket(bucketId);
      console.log('✅ Storage bucket already exists:', bucket.$id);
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
    }

    // Create the bucket if it doesn't exist
    const bucket = await storage.createBucket(
      bucketId,
      'Employee Photos',
      [
        Permission.read(Role.any()),
        Permission.create(Role.user()),
        Permission.update(Role.user()),
        Permission.delete(Role.user()),
      ],
      false, // fileSecurity
      true,  // enabled
      5000000, // maxFileSize (5MB)
      ['jpg', 'jpeg', 'png', 'gif', 'webp'], // allowedFileExtensions
      'gzip', // compression
      false, // encryption
      false  // antivirus
    );

    console.log('✅ Storage bucket created successfully:', bucket.$id);
    console.log('📝 Bucket details:');
    console.log('   - Name:', bucket.name);
    console.log('   - Max file size:', bucket.maxFileSize, 'bytes');
    console.log('   - Allowed extensions:', bucket.allowedFileExtensions);

  } catch (error) {
    console.error('❌ Error setting up storage bucket:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStorageBucket().then(() => {
  console.log('🎉 Storage setup completed!');
  process.exit(0);
});
