import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";

import { createProjectSchema, updateProjectSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";

import {
  DATABASE_ID,
  IMAGES_BUCKET_ID,
  PROJECTS_ID,
  MEMBERS_ID,
} from "@/config";
import { MemberRole } from "@/features/members/types";
import { Project } from "../types";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { workspaceId } = c.req.query();

    if (!workspaceId) {
      return c.json({ error: "Missing workspaceId" }, 400);
    }

    // Check if user is admin or member of workspace
    const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
    
    if (!isAdmin) {
      // For employees, check if they are member of workspace
      const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
      ]);

      if (member.total === 0) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }

    const projects = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.orderDesc("$createdAt"),
    ]);

    return c.json({ data: projects });
  })
  .post(
    "/",
    zValidator("form", createProjectSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, description, workspaceId, image } = c.req.valid("form");

      // Check if user is admin - only admin can create projects
      const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
      
      if (!isAdmin) {
        return c.json({ error: "Unauthorized. Only admin can create projects." }, 403);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof Blob) {
        const fileExtension = image.type.split("/")[1];
        const fileName = `project-image-${name}.${fileExtension}`;
        const fileImage = new File([image], fileName, { type: image.type });

        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          fileImage,
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id,
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer,
        ).toString("base64")}`;
      }

      const project = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_ID,
        ID.unique(),
        {
          name,
          description: description || "",
          workspaceId,
          imageUrl: uploadedImageUrl,
        },
      );

      return c.json({ data: project });
    },
  )
  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", updateProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const { name, description, image } = c.req.valid("form");

      const existingProject = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
      );

      // Check if user is admin of workspace
      const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", existingProject.workspaceId),
        Query.equal("userId", user.$id),
      ]);

      const memberData = member.documents[0];
      if (!memberData || memberData.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof Blob) {
        const fileExtension = image.type.split("/")[1];
        const fileName = `project-image-${name || existingProject.name}.${fileExtension}`;
        const fileImage = new File([image], fileName, { type: image.type });

        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          fileImage,
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id,
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer,
        ).toString("base64")}`;
      }

      const project = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        {
          name: name ?? existingProject.name,
          description: description ?? existingProject.description,
          imageUrl: uploadedImageUrl ?? existingProject.imageUrl,
        },
      );

      return c.json({ data: project });
    },
  )
  .delete("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { projectId } = c.req.param();

    const existingProject = await databases.getDocument(
      DATABASE_ID,
      PROJECTS_ID,
      projectId,
    );

    // Check if user is admin of workspace
    const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
      Query.equal("workspaceId", existingProject.workspaceId),
      Query.equal("userId", user.$id),
    ]);

    const memberData = member.documents[0];
    if (!memberData || memberData.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

    return c.json({ data: { $id: projectId } });
  });

export default app;
