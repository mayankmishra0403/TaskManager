import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";

const app = new Hono()
  .get("/test-connection", sessionMiddleware, async (c) => {
    try {
      const { testFirebaseAdminConnection } = await import('@/lib/firebase-admin');
      const result = await testFirebaseAdminConnection();
      
      return c.json({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Firebase Admin test error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, 500);
    }
  })
  
  .post("/test-send", sessionMiddleware, async (c) => {
    try {
      const { sendFCMNotificationToToken } = await import('@/lib/firebase-admin');
      
      // Test with Mayank Soni's token
      const testToken = "f1k7HKwpq7WU6CAYrGTNwY:APA91bE4Vcrcz8GOvHOPZtwri48"; // Partial token for security
      
      const result = await sendFCMNotificationToToken(testToken, {
        title: "Firebase Admin Test",
        body: "This is a test notification using Firebase Admin SDK",
        icon: "/icon-192x192.png",
        data: {
          type: "admin_test",
          timestamp: new Date().toISOString()
        }
      });
      
      return c.json({
        ...result,
        message: "Firebase Admin SDK test completed",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Firebase Admin send test error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

export default app;
