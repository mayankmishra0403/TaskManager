import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { AdminNotificationsManager } from "@/features/notifications/components/admin-notifications-manager";
import { AdminNotificationPanel } from "@/components/admin-notification-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminNotificationsPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const isAdmin = user.labels?.includes("admin") || user.email === "admin@edu-nova.tech";
  if (!isAdmin) redirect("/");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications Management</h1>
        <p className="text-muted-foreground">
          Manage system notifications and send push notifications to users
        </p>
      </div>

      <Tabs defaultValue="push-notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="push-notifications">Push Notifications</TabsTrigger>
          <TabsTrigger value="system-notifications">System Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="push-notifications">
          <AdminNotificationPanel />
        </TabsContent>

        <TabsContent value="system-notifications">
          <AdminNotificationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
