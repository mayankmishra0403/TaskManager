"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimpleNotificationBellProps {
  workspaceId: string;
}

export function SimpleNotificationBell({ workspaceId }: SimpleNotificationBellProps) {
  const [unreadCount] = useState(3); // Mock data for testing

  return (
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
  );
}
