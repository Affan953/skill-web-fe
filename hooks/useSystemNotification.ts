"use client";

import { useContext } from "react";
import { SystemNotificationContext } from "@/contexts/SystemNotificationContext";

export default function useSystemNotification() {
  const ctx = useContext(SystemNotificationContext);
  if (!ctx) {
    throw new Error("useSystemNotification must be used within SystemNotificationProvider");
  }
  return ctx;
}
