import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { FCMNotificationManager } from "@/components/fcm-notification-manager";

export default async function NotificationSettingsPage() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your push notification preferences
        </p>
      </div>

      <FCMNotificationManager />
    </div>
  );
}
