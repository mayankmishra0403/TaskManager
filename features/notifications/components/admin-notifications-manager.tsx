"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Megaphone, Search, Trash2, Filter, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDeleteNotification, useGetManageNotifications } from "../api/use-notifications";
import { BroadcastMessageModal } from "./broadcast-message-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

type Priority = "low" | "medium" | "high";

export const AdminNotificationsManager = () => {
  const { data: workspacesData } = useGetWorkspaces();
  const workspaces = workspacesData?.documents || [];
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  // If there is exactly one workspace and none selected yet, pick it by default
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.length === 1) {
      setSelectedWorkspaceId(workspaces[0].$id);
    }
  }, [selectedWorkspaceId, workspaces]);

  const { data: notifications = [], isLoading, refetch } = useGetManageNotifications(selectedWorkspaceId);
  const del = useDeleteNotification();

  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | Priority>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (notifications || []).filter((n: any) => {
      const matchesQ = q
        ? (n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q))
        : true;
      const matchesP = priority === "all" ? true : n.priority === priority;
      return matchesQ && matchesP;
    });
  }, [notifications, query, priority]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Manage Notifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">Broadcast and manage admin messages for this workspace.</p>
        </div>
        <div className="flex gap-2">
          {/* Workspace selector (visible when not locked by URL param) */}
          <Select
            value={selectedWorkspaceId}
            onValueChange={(v) => setSelectedWorkspaceId(v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((ws: any) => (
                <SelectItem key={ws.$id} value={ws.$id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {selectedWorkspaceId && (
            <BroadcastMessageModal workspaceId={selectedWorkspaceId}>
              <Button size="sm" className="gap-2">
                <Megaphone className="h-4 w-4" />
                New Broadcast
              </Button>
            </BroadcastMessageModal>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4">
        {!selectedWorkspaceId && (
          <div className="p-3 text-sm text-muted-foreground border rounded">
            Select a workspace to view and manage its notifications.
          </div>
        )}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or message"
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[480px] border rounded-md">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No admin messages found.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((n: any) => (
                <div key={n.$id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={
                          n.priority === "high"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : n.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }>
                          {n.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(n.$createdAt), "PP p")}
                        </span>
                      </div>
                      <div className="font-medium truncate">{n.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{n.message}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => del.mutate(n.$id)}
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
