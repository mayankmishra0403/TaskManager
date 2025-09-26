import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// Use Vercel domain for API calls in production, localhost in development
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://task-manager-zo6p.vercel.app';
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const client = hc<AppType>(getApiUrl(), {
  headers: {
    "Content-Type": "application/json",
  },
  init: {
    credentials: "include", // Include cookies for cross-origin requests
  },
});
