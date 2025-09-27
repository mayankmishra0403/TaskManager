"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const employees = [
  { id: '68d6e0980033a5a6ec3e', name: 'Mayank Soni', email: 'mayank@01.com', hasToken: true },
  { id: '68d6e0dc0027ec8ff9cf', name: 'Nishant Dixit', email: 'nishant@02.com', hasToken: false },
  { id: '68d6e155001f239d6c93', name: 'Mradul Tripathi', email: 'mradul@03.com', hasToken: false },
  { id: '68d6e1de002754123e04', name: 'Yashi Gupta', email: 'yashi@04.com', hasToken: false },
  { id: '68d6e24b001956824303', name: 'Avika Dwivedi', email: 'avika@05.com', hasToken: false },
];

export default function AdminNotificationPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  const sendToEmployee = async (employeeId: string, employeeName: string) => {
    if (!title || !message) {
      toast.error('Please enter title and message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/fcm/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          userId: employeeId
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`Notification sent to ${employeeName}!`);
        console.log('Send result:', result);
      } else {
        toast.error(`Failed to send: ${result.message || result.error}`);
        console.error('Send error:', result);
      }
    } catch (error) {
      toast.error('Error sending notification');
      console.error('Send error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendToAll = async () => {
    if (!title || !message) {
      toast.error('Please enter title and message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/fcm/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          allUsers: true
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Notification sent to all employees!');
        console.log('Broadcast result:', result);
      } else {
        toast.error(`Failed to send: ${result.message || result.error}`);
        console.error('Broadcast error:', result);
      }
    } catch (error) {
      toast.error('Error sending notification');
      console.error('Broadcast error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin - Send Notifications to Employees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Message Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notification Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>

          {/* Send to All */}
          <div className="border-t pt-4">
            <Button 
              onClick={sendToAll}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send to All Employees'}
            </Button>
          </div>

          {/* Employee List */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Send to Specific Employee</h3>
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-gray-600">{employee.email}</div>
                    <div className="text-xs">
                      {employee.hasToken ? (
                        <span className="text-green-600">✓ Has FCM Token</span>
                      ) : (
                        <span className="text-orange-600">⚠ No FCM Token</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => sendToEmployee(employee.id, employee.name)}
                    disabled={loading}
                    variant={employee.hasToken ? "primary" : "outline"}
                    size="sm"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Debug Info */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <p><strong>Note:</strong> Only employees with FCM tokens will receive push notifications.</p>
            <p>Employees without tokens will only receive in-app notifications.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
