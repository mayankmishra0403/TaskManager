import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import { deleteCookie, setCookie } from "hono/cookie";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, EMPLOYEES_ID } from "@/config";

const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { identifier, password } = c.req.valid("json");

    const { account, databases } = await createAdminClient();

    try {
      let loginEmail = identifier;

      // Check if identifier is an email (contains @)
      if (!identifier.includes("@")) {
        // It's an Employee ID, find the employee record
        const employees = await databases.listDocuments(DATABASE_ID, EMPLOYEES_ID, [
          Query.equal("employeeId", identifier),
          Query.equal("isActive", true),
        ]);

        if (employees.total === 0) {
          return c.json({ error: "Invalid Employee ID or Password" }, 401);
        }

        const employee = employees.documents[0];
        loginEmail = employee.email;
      }
      
      // Create session using the email and password
      const session = await account.createEmailPasswordSession(loginEmail, password);

      setCookie(c, AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none", // Allow cross-site cookies for custom domain
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true });
    } catch (error) {
      const errorDetails = error as any;
      console.error("Login error details:", {
        identifier,
        error: errorDetails?.message || error,
        type: errorDetails?.type,
        code: errorDetails?.code,
        environment: {
          appwriteEndpoint: process.env.NEXT_APPWRITE_ENDPOINT,
          projectId: process.env.NEXT_APPWRITE_PROJECT,
          hasApiKey: !!process.env.NEXT_APPWRITE_KEY,
          hasDatabaseId: !!process.env.NEXT_APPWRITE_DATABASE_ID,
          hasEmployeesId: !!process.env.NEXT_APPWRITE_EMPLOYEES_ID,
        }
      });
      return c.json({ 
        error: "Invalid credentials",
        debug: process.env.NODE_ENV === 'development' ? errorDetails?.message : undefined
      }, 401);
    }
  })
  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");

    deleteCookie(c, AUTH_COOKIE);

    await account.deleteSession("current");

    return c.json({ success: true });
  });
export default app;
