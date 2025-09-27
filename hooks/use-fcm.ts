"use client";

import { useState, useEffect } from 'react';
import { requestPermissionAndGetToken } from '@/lib/firebase';
import { toast } from 'sonner';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: {
    [key: string]: string;
  };
}

export const useFCM = () => {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check current notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize FCM and request permission
  const initializeFCM = async () => {
    try {
      const fcmToken = await requestPermissionAndGetToken();
      if (fcmToken) {
        setToken(fcmToken);
        setNotificationPermission('granted');
        
        // Send token to backend for storage
        try {
          await fetch('/api/fcm/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken })
          });
          console.log('FCM Token saved to backend');
        } catch (error) {
          console.error('Failed to save FCM token to backend:', error);
        }

        return fcmToken;
      } else {
        setNotificationPermission('denied');
        return null;
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
      setNotificationPermission('denied');
      return null;
    }
  };

  return {
    token,
    notificationPermission,
    initializeFCM,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window,
  };
};
