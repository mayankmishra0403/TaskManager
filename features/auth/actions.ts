import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";
import { AUTH_COOKIE } from "./constants";
import { getAppwriteConfig } from "@/lib/env-config";

export const getCurrent = async () => {
  try {
    const config = getAppwriteConfig();
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.project);

    const session = await cookies().get(AUTH_COOKIE);

    if (!session) return null;

    client.setSession(session.value);

    const account = new Account(client);

    return await account.get();
  } catch {
    return null;
  }
};
