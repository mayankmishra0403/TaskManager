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
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ error: "Invalid credentials" }, 401);
    }
  })
  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");

    deleteCookie(c, AUTH_COOKIE);

    await account.deleteSession("current");

    return c.json({ success: true });
  });
export default app;
