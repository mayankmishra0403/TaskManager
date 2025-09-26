"use client";

import { useEffect, useState } from "react";
import Navigation from "./navigation";
import NavigationErrorBoundary from "./navigation-error-boundary";

export const NavigationWrapper = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col space-y-2 p-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <NavigationErrorBoundary>
      <Navigation />
    </NavigationErrorBoundary>
  );
};
