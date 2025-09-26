"use client";

export default function DebugPage() {
  const envVars = {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
    NEXT_PUBLIC_APPWRITE_DATABASE: process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
    NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID: process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Environment Variables</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre>{JSON.stringify(envVars, null, 2)}</pre>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Current URL</h2>
        <p>{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
      </div>
    </div>
  );
}
