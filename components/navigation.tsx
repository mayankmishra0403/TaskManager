"use client";

import { cn } from "@/lib/utils";
import { SettingsIcon, UsersIcon, FolderIcon, ShieldIcon, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCurrent } from "@/features/auth/api/use-current";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";
const Navigation = () => {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params?.workspaceId as string;
  const { data: user, isLoading } = useCurrent();

  // Add loading state and safety checks
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-2 p-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

  const routes = isAdmin ? [
    // Admin routes
    {
      label: "Dashboard",
      href: `/`,
      icon: GoHome,
      activeIcon: GoHomeFill,
    },
    {
      label: "Manage Employees",
      href: `/admin/employees`,
      icon: UsersIcon,
      activeIcon: UsersIcon,
    },
    {
      label: "All Tasks",
      href: `/admin/tasks`,
      icon: GoCheckCircle,
      activeIcon: GoCheckCircleFill,
    },
    {
      label: "Create Task",
      href: `/admin/tasks/create`,
      icon: ShieldIcon,
      activeIcon: ShieldIcon,
    },
  ] : [
    // Employee routes
    {
      label: "Dashboard",
      href: `/`,
      icon: GoHome,
      activeIcon: GoHomeFill,
    },
    {
      label: "My Tasks",
      href: `/my-tasks`,
      icon: GoCheckCircle,
      activeIcon: GoCheckCircleFill,
    },
  ];

  return (
    <ul className="flex flex-col">
      {routes.map((item) => {
        // Skip invalid routes
        if (!item.href || item.href.includes('undefined')) {
          return null;
        }
        
        const isActive = pathname === item.href;
        const Icon = isActive ? item.activeIcon : item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500",
                isActive && "bg-white shadow-sm hover:opacity-100 text-primary",
              )}
            >
              <Icon className="size-5 text-neutral-500" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </ul>
  );
};

export default Navigation;
