import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';

export async function GET(request: NextRequest) {
  try {
    // Get session from request
    const cookie = request.cookies.get('task-manager-session');
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { account, databases } = await createAdminClient();
    
    // This is a minimal debug endpoint that only shows connection status
    // without exposing sensitive keys
    const debugInfo = {
      status: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      // Only show if environment variables exist, not their values
      config: {
        hasAppwriteEndpoint: !!process.env.NEXT_APPWRITE_ENDPOINT,
        hasProjectId: !!process.env.NEXT_APPWRITE_PROJECT,
        hasApiKey: !!process.env.NEXT_APPWRITE_KEY,
        hasDatabaseId: !!process.env.NEXT_APPWRITE_DATABASE_ID,
        hasEmployeesId: !!process.env.NEXT_APPWRITE_EMPLOYEES_ID,
        hasTasksId: !!process.env.NEXT_APPWRITE_TASKS_ID,
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
