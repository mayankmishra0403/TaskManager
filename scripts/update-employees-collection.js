import { Client, Databases } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const EMPLOYEES_ID = process.env.NEXT_PUBLIC_APPWRITE_EMPLOYEES_ID;

async function addAssignedProjectsAttribute() {
  try {
    console.log("Adding assignedProjects attribute to employees collection...");
    
    // Add assignedProjects as string array attribute
    await databases.createStringAttribute(
      DATABASE_ID,
      EMPLOYEES_ID,
      "assignedProjects",
      255,
      false,
      undefined,
      true // array
    );
    
    console.log("✅ Successfully added assignedProjects attribute");
    
  } catch (error) {
    console.error("❌ Error adding assignedProjects attribute:", error);
  }
}

addAssignedProjectsAttribute();
