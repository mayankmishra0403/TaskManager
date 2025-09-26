require('dotenv').config({ path: '.env.local' });

async function testPhotoURL() {
  const photoURL = 'https://fra.cloud.appwrite.io/v1/storage/buckets/68d501b20008310c2ff6/files/68d6d787000afeb1c2e7/view?project=68d5009e001f31eed4a4';
  
  console.log('Testing photo URL accessibility...');
  console.log('URL:', photoURL);
  
  try {
    const response = await fetch(photoURL);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Photo is accessible!');
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
    } else {
      console.log('❌ Photo is not accessible');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testPhotoURL();
