"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useFCM } from '@/hooks/use-fcm';
import { toast } from 'sonner';
import { ClientOnly } from '@/components/client-only';

export const FCMNotificationManager = () => {
  const { token, notificationPermission, initializeFCM, isSupported } = useFCM();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Loading notification settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const fcmToken = await initializeFCM();
      if (fcmToken) {
        toast.success('Push notifications enabled successfully!');
      } else {
        toast.error('Failed to enable push notifications');
      }
    } catch (error) {
      toast.error('Error enabling notifications');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  const getPermissionIcon = () => {
    return notificationPermission === 'granted' ? 
      <Bell className="h-5 w-5 text-green-600" /> : 
      <BellOff className="h-5 w-5 text-gray-400" />;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications or service workers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <ClientOnly>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPermissionIcon()}
            Push Notifications
            {getPermissionBadge()}
          </CardTitle>
          <CardDescription>
            Enable push notifications to receive real-time updates about tasks, assignments, and important messages.
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationPermission === 'default' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Enable Notifications</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Get notified about new task assignments, updates, and important messages instantly.
                </p>
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="mt-3"
                  size="sm"
                >
                  {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'granted' && (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Notifications Enabled</h4>
                  <p className="text-sm text-green-700 mt-1">
                    You'll receive push notifications for task updates and important messages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <BellOff className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">Notifications Blocked</h4>
                <p className="text-sm text-red-700 mt-1">
                  Push notifications are blocked. To enable them:
                </p>
                <ol className="text-sm text-red-700 mt-2 ml-4 list-decimal space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Change notifications from "Block" to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>What you'll be notified about:</strong></p>
          <ul className="ml-4 space-y-0.5">
            <li>• New task assignments</li>
            <li>• Task status changes</li>
            <li>• Important messages from admins</li>
            <li>• Project updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </ClientOnly>
  );
};
