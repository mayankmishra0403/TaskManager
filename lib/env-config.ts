// Environment configuration helper
export const getAppwriteConfig = () => {
  // Use server-side variables first, fallback to public ones
  const endpoint = process.env.NEXT_APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_APPWRITE_PROJECT || process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const apiKey = process.env.NEXT_APPWRITE_KEY;
  const databaseId = process.env.NEXT_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
  const employeesId = process.env.NEXT_APPWRITE_EMPLOYEES_ID || process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID;
  const tasksId = process.env.NEXT_APPWRITE_TASKS_ID || process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID;

  if (!endpoint || !project) {
    throw new Error('Missing required Appwrite configuration');
  }

  return {
    endpoint,
    project,
    apiKey,
    databaseId,
    employeesId,
    tasksId,
  };
};
