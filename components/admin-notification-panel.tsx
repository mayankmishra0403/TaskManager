"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Send, Users, User } from "lucide-react";

export function AdminNotificationPanel() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    userId: "",
    allUsers: false,
  });

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Please fill in title and message");
      return;
    }

    if (!formData.allUsers && !formData.userId) {
      toast.error("Please specify a user ID or select 'Send to all users'");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          userId: formData.allUsers ? undefined : formData.userId,
          allUsers: formData.allUsers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Push notification and in-app notification sent successfully! Recipients will see it in both their browser and notification bell.");
        setFormData({ title: "", message: "", userId: "", allUsers: false });
      } else {
        toast.error(result.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fcm/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Admin Test Notification",
          body: "This is a test notification sent by the admin",
          type: "test"
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Test notification sent successfully! Check Mayank Soni's browser for the notification.");
      } else {
        toast.error(result.message || "Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Please fill in title and message");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fcm/notifications/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Announcement sent successfully to all users! They will receive both push notifications and in-app notifications.");
        setFormData({ title: "", message: "", userId: "", allUsers: false });
      } else {
        toast.error(result.message || "Failed to send announcement");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast.error("Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Notification message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="all-users"
              checked={formData.allUsers}
              onCheckedChange={(checked: boolean) => 
                setFormData({ ...formData, allUsers: checked, userId: checked ? "" : formData.userId })
              }
            />
            <Label htmlFor="all-users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Send to all users
            </Label>
          </div>

          {!formData.allUsers && (
            <div className="space-y-2">
              <Label htmlFor="userId" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User ID
              </Label>
              <Input
                id="userId"
                placeholder="Specific user ID"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendNotification}
              disabled={loading}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Notification"}
            </Button>

            <Button
              onClick={handleSendAnnouncement}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Announcement"}
            </Button>
          </div>

          <Button
            onClick={handleSendTestNotification}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            {loading ? "Sending..." : "Send Test Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
