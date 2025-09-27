"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debugFCMSetup, requestPermissionAndGetToken } from '@/lib/firebase';
import { toast } from 'sonner';

export default function FCMTestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const handleDebug = async () => {
    addLog('Starting FCM debug...');
    await debugFCMSetup();
    addLog('FCM debug completed - check console for details');
  };

  const handleRequestToken = async () => {
    setLoading(true);
    addLog('Requesting FCM token...');
    
    try {
      const fcmToken = await requestPermissionAndGetToken();
      if (fcmToken) {
        setToken(fcmToken);
        addLog(`Token generated successfully: ${fcmToken.substring(0, 20)}...`);
        toast.success('FCM token generated successfully!');
      } else {
        addLog('Failed to generate token - check console for details');
        toast.error('Failed to generate FCM token');
      }
    } catch (error) {
      addLog(`Error: ${error}`);
      toast.error('Error generating FCM token');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSaveToken = async () => {
    if (!token) {
      toast.error('No token to save');
      return;
    }

    addLog('Saving token to backend...');
    try {
      const response = await fetch('/api/fcm/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();
      
      if (response.ok) {
        addLog('Token saved successfully');
        toast.success('Token saved to backend');
      } else {
        addLog(`Failed to save token: ${result.error}`);
        toast.error('Failed to save token');
      }
    } catch (error) {
      addLog(`Save token error: ${error}`);
      toast.error('Error saving token');
    }
  };

  const handleTestNotification = async () => {
    addLog('Testing notification send...');
    try {
      const response = await fetch('/api/fcm/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from FCM debug page',
          type: 'test'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addLog(`Notification sent: ${result.message}`);
        toast.success('Test notification sent!');
      } else {
        addLog(`Failed to send notification: ${result.error || result.message}`);
        toast.error('Failed to send notification');
      }
    } catch (error) {
      addLog(`Send notification error: ${error}`);
      toast.error('Error sending notification');
    }
  };

  const handleCheckSavedTokens = async () => {
    addLog('Checking saved FCM tokens...');
    try {
      const response = await fetch('/api/fcm/tokens', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (response.ok) {
        addLog(`Found ${result.count} saved FCM tokens for your account`);
        if (result.tokens && result.tokens.length > 0) {
          addLog(`Your token: ${result.tokens[0].substring(0, 20)}...`);
          addLog(`Last updated: ${result.lastUpdated || 'Unknown'}`);
        } else {
          addLog('No FCM tokens found for your account. Generate and save one first!');
        }
        toast.success(`Found ${result.count} FCM tokens`);
      } else {
        addLog(`Error checking tokens: ${result.error}`);
        toast.error('Error checking tokens');
      }
    } catch (error) {
      addLog(`Check tokens error: ${error}`);
      toast.error('Error checking tokens');
    }
  };

  const handleTestFirebaseAdmin = async () => {
    addLog('Testing Firebase Admin SDK connection...');
    try {
      const response = await fetch('/api/fcm/admin-test/test-connection', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog('✅ Firebase Admin SDK connection successful');
        toast.success('Firebase Admin SDK is working!');
      } else {
        addLog(`❌ Firebase Admin SDK connection failed: ${result.error}`);
        toast.error('Firebase Admin SDK connection failed');
      }
    } catch (error) {
      addLog(`Firebase Admin test error: ${error}`);
      toast.error('Firebase Admin test error');
    }
  };

  const handleTestFirebaseAdminSend = async () => {
    addLog('Testing Firebase Admin SDK send notification...');
    try {
      const response = await fetch('/api/fcm/admin-test/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog(`✅ Firebase Admin send successful: ${result.successCount} sent, ${result.failureCount} failed`);
        toast.success('Firebase Admin send test successful!');
      } else {
        addLog(`❌ Firebase Admin send failed: ${result.error}`);
        toast.error('Firebase Admin send test failed');
      }
    } catch (error) {
      addLog(`Firebase Admin send error: ${error}`);
      toast.error('Firebase Admin send error');
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>FCM Debug & Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Debug Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Debug FCM Setup</h3>
            <Button onClick={handleDebug} variant="outline">
              Run FCM Debug
            </Button>
          </div>

          {/* Token Generation */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Generate FCM Token</h3>
            <div className="space-x-2">
              <Button 
                onClick={handleRequestToken} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Generating...' : 'Request FCM Token'}
              </Button>
              
              {token && (
                <Button onClick={handleTestSaveToken} variant="outline">
                  Save Token to Backend
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button onClick={handleCheckSavedTokens} variant="outline">
                Check Saved Tokens
              </Button>
              
              <Button onClick={handleTestNotification} className="bg-green-600 hover:bg-green-700">
                Send Test Notification
              </Button>
            </div>
          </div>

          {/* Firebase Admin SDK Testing */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Firebase Admin SDK Testing</h3>
            <div className="space-x-2">
              <Button onClick={handleTestFirebaseAdmin} variant="outline">
                Test Firebase Admin Connection
              </Button>
              
              <Button onClick={handleTestFirebaseAdminSend} className="bg-purple-600 hover:bg-purple-700">
                Test Firebase Admin Send
              </Button>
            </div>
            
            {token && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-900">Token Generated:</p>
                <p className="text-xs font-mono text-green-700 break-all mt-1">
                  {token}
                </p>
              </div>
            )}
          </div>

          {/* Environment Check */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Environment Check</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>VAPID Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✓ Present' : '✗ Missing'}</p>
                <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Present' : '✗ Missing'}</p>
                <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing'}</p>
              </div>
              <div>
                <p><strong>Service Worker:</strong> {typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? '✓ Supported' : '✗ Not supported'}</p>
                <p><strong>Notifications:</strong> {typeof window !== 'undefined' && 'Notification' in window ? '✓ Supported' : '✗ Not supported'}</p>
                <p><strong>Push Manager:</strong> {typeof window !== 'undefined' && 'PushManager' in window ? '✓ Supported' : '✗ Not supported'}</p>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Debug Logs</h3>
              <Button onClick={clearLogs} variant="ghost" size="sm">
                Clear Logs
              </Button>
            </div>
            <div className="bg-gray-50 border rounded p-3 h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
