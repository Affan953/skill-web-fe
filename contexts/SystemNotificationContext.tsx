"use client";

import {
  createContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  type QueuedNotification,
  type SystemNotificationData,
  playMissionSound,
  playLevelUpSound,
  playAchievementSound,
  playXpSound,
  playQuestSound,
  playSoftBlip,
  attachAudioUnlock,
} from "@/lib/systemNotification";

let globalId = 0;
function nextId(): string {
  globalId += 1;
  return `sn-${globalId}-${Date.now()}`;
}

function triggerSoundForType(type: string) {
  switch (type) {
    case "LEVEL_UP":
      playLevelUpSound();
      break;
    case "ACHIEVEMENT_UNLOCKED":
    case "NEW_TITLE":
      playAchievementSound();
      break;
    case "XP_GAINED":
      playXpSound();
      break;
    case "MISSION_VERIFIED":
      playMissionSound();
      break;
    case "QUEST_COMPLETED":
    case "STREAK_UPDATED":
      playQuestSound();
      break;
    case "REFLECTION_SAVED":
    case "JOURNEY_RECORDED":
    case "CATEGORY_IMPROVED":
    case "WEEKLY_REVIEW":
    case "MONTHLY_REPORT":
    default:
      playSoftBlip();
      break;
  }
}

interface NotificationQueueState {
  queueRef: { current: QueuedNotification[] };
  processingRef: { current: boolean };
  timerRef: { current: NodeJS.Timeout | null };
  setCurrent: (notification: QueuedNotification | null) => void;
  setIsShowing: (showing: boolean) => void;
}

function drainQueue(state: NotificationQueueState) {
  if (state.processingRef.current) return;
  if (state.queueRef.current.length === 0) {
    state.setCurrent(null);
    state.setIsShowing(false);
    return;
  }

  state.processingRef.current = true;
  const next = state.queueRef.current.shift()!;
  state.setCurrent(next);
  state.setIsShowing(true);
  if (!next.silent) triggerSoundForType(next.type);

  const duration = next.duration || 3000;
  state.timerRef.current = setTimeout(() => {
    state.setIsShowing(false);
    setTimeout(() => {
      state.setCurrent(null);
      state.processingRef.current = false;
      drainQueue(state);
    }, 400);
  }, duration);
}

export interface SystemNotificationContextValue {
  show: (data: SystemNotificationData) => string;
  enqueue: (data: SystemNotificationData) => string;
  enqueueSequence: (items: SystemNotificationData[]) => string[];
  clear: () => void;
  current: QueuedNotification | null;
  isShowing: boolean;
}

export const SystemNotificationContext = createContext<SystemNotificationContextValue>({
  show: () => "",
  enqueue: () => "",
  enqueueSequence: () => [],
  clear: () => {},
  current: null,
  isShowing: false,
});

export function SystemNotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<QueuedNotification | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  const queueRef = useRef<QueuedNotification[]>([]);
  const processingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const processNext = useCallback(() => {
    drainQueue({ queueRef, processingRef, timerRef, setCurrent, setIsShowing });
  }, [queueRef, processingRef, timerRef, setCurrent, setIsShowing]);

  const enqueue = useCallback(
    (data: SystemNotificationData): string => {
      const id = data.id || nextId();
      const item: QueuedNotification = { ...data, id, timestamp: Date.now() };

      if (data.priority === "high" && queueRef.current.length > 0) {
        queueRef.current.unshift(item);
      } else {
        queueRef.current.push(item);
      }

      if (!processingRef.current) {
        processNext();
      }
      return id;
    },
    [processNext]
  );

  const enqueueSequence = useCallback(
    (items: SystemNotificationData[]): string[] => {
      const ids: string[] = [];
      items.forEach((item) => {
        ids.push(enqueue(item));
      });
      return ids;
    },
    [enqueue]
  );

  const show = useCallback(
    (data: SystemNotificationData): string => {
      return enqueue(data);
    },
    [enqueue]
  );

  const clear = useCallback(() => {
    queueRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(null);
    setIsShowing(false);
    processingRef.current = false;
  }, []);

  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Unlock the shared Web Audio context on the user's first interaction so
  // notification/completion sounds can play later (browser autoplay rules).
  useEffect(() => attachAudioUnlock(), []);

  return (
    <SystemNotificationContext.Provider
      value={{ show, enqueue, enqueueSequence, clear, current, isShowing }}
    >
      {children}
    </SystemNotificationContext.Provider>
  );
}
