import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import auth from "@/features/auth/server/route";
import workspaces from "@/features/workspaces/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import employees from "@/features/employees/server/route";
import admin from "@/features/admin/server/route";
import notifications from "@/features/notifications/server/route";
import fcm from "@/features/fcm/server/route";
import fcmNotifications from "@/features/fcm/server/notifications";
import fcmAdminTest from "@/features/fcm/server/firebase-admin-test";

// export const runtime = "edge"; // Disabled for Firebase Admin SDK compatibility

const app = new Hono().basePath("/api");

// Add CORS middleware for cross-origin requests
app.use("/*", cors({
  origin: [
    "https://task-manager-zo6p.vercel.app",
    "https://tm.edu-nova.tech",
    "http://localhost:3000"
  ],
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

const routes = app
  .route("/auth", auth)
  .route("/workspaces", workspaces)
  .route("/projects", projects)  
  .route("/tasks", tasks)
  .route("/employees", employees)
  .route("/admin", admin)
  .route("/notifications", notifications)
  .route("/fcm", fcm)
  .route("/fcm/notifications", fcmNotifications)
  .route("/fcm/admin-test", fcmAdminTest);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

export type AppType = typeof routes;
