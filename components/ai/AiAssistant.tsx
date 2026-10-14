"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAiContext } from "@/contexts/AiContext";
import { useAiChat } from "@/hooks/useAiChat";
import { AiOrb } from "./AiOrb";
import { AiPanel } from "./AiPanel";

/**
 * Glue between the orb and the chat panel.
 *
 * Rendered once in the app shell, so the assistant is available on every
 * authenticated page (it is simply not mounted on the `/admin` shell). ESC
 * closes the panel; the orb is hidden while open so there is exactly one
 * affordance at any time. The inner component is keyed by user id so every
 * sign-in starts with a fresh transcript state.
 */
export function AiAssistant() {
  const { user } = useAuth();
  if (!user) return null;
  return <AiAssistantInner key={user.uid} />;
}

function AiAssistantInner() {
  const { context } = useAiContext();
  const chat = useAiChat();

  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const exitBrowserFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  };

  const closePanel = () => {
    setFullscreen(false);
    setOpen(false);
    exitBrowserFullscreen();
  };

  const closePanelRef = useRef(closePanel);
  useEffect(() => {
    closePanelRef.current = closePanel;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closePanelRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggleFullscreen = () => {
    if (fullscreen) {
      setFullscreen(false);
      exitBrowserFullscreen();
    } else {
      setFullscreen(true);
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <AiPanel
          key="panel"
          messages={chat.messages}
          sessions={chat.sessions}
          activeId={chat.activeId}
          activeTitle={chat.activeTitle}
          status={chat.status}
          hydrated={chat.hydrated}
          loading={chat.loading}
          context={context}
          error={chat.error}
          canSend={chat.canSend}
          fullscreen={fullscreen}
          onSend={(text) => void chat.send(text)}
          onStop={chat.stop}
          onSelectSession={(id) => void chat.selectSession(id)}
          onNewChat={chat.startNew}
          onDeleteSession={(id) => void chat.deleteSession(id)}
          onDeleteAll={() => void chat.deleteAll()}
          onClose={closePanel}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <AiOrb key="orb" onClick={() => setOpen(true)} />
      )}
    </AnimatePresence>
  );
}