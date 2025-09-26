import { Models } from "node-appwrite";

export type Project = Models.Document & {
  name: string;
  description?: string;
  workspaceId: string;
  imageUrl?: string;
};
