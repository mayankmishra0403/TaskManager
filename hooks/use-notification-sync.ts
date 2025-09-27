"use client";

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useNotificationSync = () => {
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        console.log('Received notification update from service worker:', event.data);
        
        // Invalidate notifications query to refresh the notification list
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        
        // If it's a click event, handle navigation
        if (event.data.action === 'click' && event.data.targetUrl) {
          // The service worker already handles navigation, but we can add additional logic here
          console.log('Notification clicked, navigating to:', event.data.targetUrl);
        }
      }
    };

    // Add event listener for service worker messages
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Also listen for foreground messages (when app is active)
    const handleForegroundMessage = () => {
      // Import Firebase messaging and handle foreground messages
      import('@/lib/firebase').then(({ messaging }) => {
        if (messaging) {
          import('firebase/messaging').then(({ onMessage }) => {
            onMessage(messaging, (payload) => {
              console.log('Foreground message received:', payload);
              
              // Refresh notification list
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              
              // You can also show a toast notification here
              import('sonner').then(({ toast }) => {
                const title = payload.data?.title || payload.notification?.title || 'New Notification';
                const body = payload.data?.body || payload.notification?.body || 'You have a new notification';
                
                toast(title, {
                  description: body,
                  duration: 5000,
                  action: {
                    label: 'View',
                    onClick: () => {
                      // Handle click action - could navigate to specific page
                      const url = payload.data?.url;
                      if (url && url !== window.location.pathname) {
                        window.location.href = url;
                      }
                    },
                  },
                });
              });
            });
          });
        }
      });
    };

    // Set up foreground message handling
    handleForegroundMessage();

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [queryClient]);
};

export default useNotificationSync;
