'use client';

import { useEffect } from 'react';

export default function PWAUpdater() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Check for updates every 30 seconds when app is active
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      };

      const interval = setInterval(checkForUpdates, 30000);
      
      // Also check when the app becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });

      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  return null;
}
