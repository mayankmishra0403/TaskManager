"use client";

import { UserButton } from "@/features/auth/components/user-button";
import React from "react";
import MobileSidebar from "./mobile-sidebar";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useCurrent } from "@/features/auth/api/use-current";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetCurrentEmployee } from "@/features/employees/api/use-get-current-employee";

const Navbar = () => {
  const { data: user } = useCurrent();
  const workspaceId = useWorkspaceId();
  const { data: employee } = useGetCurrentEmployee();
  const effectiveWorkspaceId = workspaceId || employee?.workspaceId;

  return (
    <nav className="pt-4 px-6 flex items-center justify-between">
      <div className=" flex-col hidden lg:flex">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-muted-foreground">
          Monitor all your projects and tasks here
        </p>
      </div>
      <MobileSidebar />
      <div className="flex items-center space-x-2">
        {user && (
          <NotificationBell workspaceId={effectiveWorkspaceId} />
        )}
        <UserButton />
      </div>
    </nav>
  );
};

export default Navbar;
