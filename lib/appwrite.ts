import "server-only";
import { Client, Account, Storage, Users, Databases, Messaging } from "node-appwrite";
import { getAppwriteConfig } from "./env-config";

export async function createAdminClient() {
  const config = getAppwriteConfig();
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setKey(config.apiKey!);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get users() {
      return new Users(client);
    },
    get messaging() {
      return new Messaging(client);
    },
  };
}
