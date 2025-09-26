import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// Use current domain for API calls to avoid cross-origin issues
const getApiUrl = () => {
  // In browser, use the current origin (same domain as the frontend)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For server-side rendering, try to get the host from headers or use default
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
