import { Suspense } from "react";
import { getSessionUser } from "@/src/features/auth";
import { getNotificationsForUser } from "./queries";
import { NotificationPanel } from "./notification-panel";

async function BellWithData() {
  const user = await getSessionUser();
  if (!user) return null;

  const notifications = await getNotificationsForUser(user.id);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return <NotificationPanel notifications={notifications} unreadCount={unreadCount} />;
}

export function NotificationBell() {
  return (
    <Suspense fallback={<div className="h-7 w-7" />}>
      <BellWithData />
    </Suspense>
  );
}
