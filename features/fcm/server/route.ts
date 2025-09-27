import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { getAppwriteConfig } from "@/lib/env-config";
import { ID, Query } from "node-appwrite";

const saveFCMTokenSchema = z.object({
  token: z.string().min(1, "FCM token is required"),
});

const app = new Hono()
  .post("/save-token", sessionMiddleware, zValidator("json", saveFCMTokenSchema), async (c) => {
    const user = c.get("user");
    const { token } = c.req.valid("json");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Check if user already has an FCM token stored
      const existingTokens = await databases.listDocuments(
        config.databaseId!,
        process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
        [Query.equal("userId", user.$id)]
      );

      if (existingTokens.total > 0) {
        // Update existing token
        await databases.updateDocument(
          config.databaseId!,
          process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
          existingTokens.documents[0].$id,
          {
            token,
            updatedAt: new Date().toISOString(),
          }
        );
      } else {
        // Create new token record
        await databases.createDocument(
          config.databaseId!,
          process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
          ID.unique(),
          {
            userId: user.$id,
            token,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      }

      return c.json({ success: true, message: "FCM token saved successfully" });
    } catch (error) {
      console.error("Error saving FCM token:", error);
      return c.json({ error: "Failed to save FCM token" }, 500);
    }
  })
  .get("/tokens", sessionMiddleware, async (c) => {
    const user = c.get("user");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Get user's FCM tokens
      const userTokens = await databases.listDocuments(
        config.databaseId!,
        process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
        [Query.equal("userId", user.$id)]
      );

      const tokens = userTokens.documents.map((doc: any) => doc.token);

      return c.json({ 
        success: true, 
        count: tokens.length,
        tokens,
        lastUpdated: userTokens.documents[0]?.updatedAt
      });
    } catch (error) {
      console.error("Error getting FCM tokens:", error);
      return c.json({ error: "Failed to get FCM tokens" }, 500);
    }
  })
  .delete("/remove-token", sessionMiddleware, async (c) => {
    const user = c.get("user");

    try {
      const { databases } = await createAdminClient();
      const config = getAppwriteConfig();

      // Find and delete user's FCM token
      const existingTokens = await databases.listDocuments(
        config.databaseId!,
        process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
        [Query.equal("userId", user.$id)]
      );

      if (existingTokens.total > 0) {
        await databases.deleteDocument(
          config.databaseId!,
          process.env.NEXT_PUBLIC_APPWRITE_FCM_TOKENS_ID!,
          existingTokens.documents[0].$id
        );
      }

      return c.json({ success: true, message: "FCM token removed successfully" });
    } catch (error) {
      console.error("Error removing FCM token:", error);
      return c.json({ error: "Failed to remove FCM token" }, 500);
    }
  });

export default app;
