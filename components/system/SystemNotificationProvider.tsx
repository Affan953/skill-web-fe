"use client";

import { SystemNotificationProvider as Provider } from "@/contexts/SystemNotificationContext";
import SystemNotification from "@/components/system/SystemNotification";
import useSystemNotification from "@/hooks/useSystemNotification";
import type { ReactNode } from "react";

function NotificationRenderer() {
  const { current, isShowing } = useSystemNotification();

  if (!current) return null;

  return <SystemNotification notification={current} isShowing={isShowing} />;
}

export default function SystemNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Provider>
      {children}
      <NotificationRenderer />
    </Provider>
  );
}
