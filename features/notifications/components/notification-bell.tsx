"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useGetNotifications, useMarkAsRead, useDeleteNotification } from "../api/use-notifications";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { Notification } from "../types";

interface NotificationBellProps {
  workspaceId?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "task_assigned":
      return "📋";
    case "admin_message":
      return "📢";
    case "task_update":
      return "🔄";
    default:
      return "ℹ️";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function NotificationBell({ workspaceId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // If a workspaceId is provided by parent, skip fetching workspaces to avoid unnecessary 401s
  const shouldFetchWorkspaces = !workspaceId;
  const { data: workspacesData, isLoading: workspacesLoading } = useGetWorkspaces({ enabled: shouldFetchWorkspaces });
  const workspaces = workspacesData?.documents || [];
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [effectiveWorkspaceId, setEffectiveWorkspaceId] = useState<string>("");

  // Immediately use any available workspaceId
  useEffect(() => {
    // If a workspaceId is provided via props, use it
    if (workspaceId) {
      setEffectiveWorkspaceId(workspaceId);
      setSelectedWorkspaceId(workspaceId);
    } 
    // Otherwise if workspaces loaded and exactly one exists, use that one
    else if (!workspacesLoading && workspaces.length === 1) {
      setEffectiveWorkspaceId(workspaces[0].$id);
      setSelectedWorkspaceId(workspaces[0].$id);
    }
    // If multiple workspaces and one is selected, use the selected one
    else if (selectedWorkspaceId) {
      setEffectiveWorkspaceId(selectedWorkspaceId);
    }
    // If multiple workspaces and nothing selected yet, use the first one
    else if (!workspacesLoading && workspaces.length > 0) {
      setEffectiveWorkspaceId(workspaces[0].$id);
      setSelectedWorkspaceId(workspaces[0].$id);
    }
  }, [workspaceId, selectedWorkspaceId, workspaces, workspacesLoading]);

  // The hooks accept empty string too; server now supports optional workspace filter
  const hasWorkspace = !!effectiveWorkspaceId;
  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useGetNotifications(hasWorkspace ? effectiveWorkspaceId : "");
  
  console.log("Notifications data:", notifications);
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Handle workspace switching if multiple workspaces exist
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setEffectiveWorkspaceId(workspaceId);
  };

  const handleMarkAllAsRead = () => {
    if (unreadNotifications.length > 0) {
      const notificationIds = unreadNotifications.map(n => n.$id);
      markAsRead.mutate({ notificationIds });
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate({ notificationIds: [notificationId] });
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  // When popover opens, ensure latest data is fetched
  useEffect(() => {
    if (isOpen && hasWorkspace) {
      refetchNotifications();
    }
  }, [isOpen, hasWorkspace, effectiveWorkspaceId, refetchNotifications]);

  // Eagerly refetch once we get a workspace id the first time
  useEffect(() => {
    if (hasWorkspace) {
      refetchNotifications();
    }
  }, [hasWorkspace, effectiveWorkspaceId, refetchNotifications]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Workspace selector (only shown when multiple workspaces exist) */}
            {workspaces.length > 1 && (
              <div className="mt-2">
                <select 
                  className="w-full p-1 text-xs border rounded-md" 
                  value={selectedWorkspaceId}
                  onChange={(e) => handleWorkspaceChange(e.target.value)}
                >
                  {workspaces.map(workspace => (
                    <option key={workspace.$id} value={workspace.$id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {workspacesLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading workspaces...
                </div>
              ) : !effectiveWorkspaceId ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p className="mb-2">No workspace selected</p>
                  {workspaces.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleWorkspaceChange(workspaces[0].$id)}>
                      Select workspace
                    </Button>
                  )}
                </div>
              ) : notificationsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.$id}
                      className={`p-4 hover:bg-muted/50 transition-colors relative ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {notification.title || "Notification"}
                            </h4>
                            <div className="flex items-center space-x-1 ml-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.$id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="mb-2">
                            <p
                              className={
                                expanded[notification.$id]
                                  ? "text-sm text-foreground whitespace-pre-wrap"
                                  : "text-sm text-foreground line-clamp-3"
                              }
                            >
                              {notification.message}
                            </p>
                            {notification.message?.length > 120 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-6 px-0 text-xs"
                                onClick={() =>
                                  setExpanded((prev) => ({
                                    ...prev,
                                    [notification.$id]: !prev[notification.$id],
                                  }))
                                }
                              >
                                {expanded[notification.$id] ? "Show less" : "Show more"}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
                            </span>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.$id)}
                                className="text-xs h-6 px-2"
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
