"use client";

import { useParams, useRouter } from "next/navigation";
import { ConversationListPane } from "@/components/messaging/ConversationListPane";
import { MessageThread } from "@/components/messaging/MessageThread";
import { MessagingError } from "@/components/messaging/messagingStates";

/**
 * One conversation.
 *
 * Desktop keeps the list beside the thread so switching conversations is one
 * click. Mobile drops the list entirely: the thread owns the full viewport,
 * including its own header with a back link, because a half-width conversation
 * on a 390px screen is not a conversation.
 */
export default function ConversationPage() {
  const router = useRouter();
  const params = useParams<{ conversationId: string | string[] }>();
  const raw = params?.conversationId;
  const conversationId = Array.isArray(raw) ? raw[0] : raw;

  if (!conversationId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-1 py-8">
        <MessagingError
          message="This conversation could not be found."
          onRetry={() => router.push("/messages")}
        />
      </div>
    );
  }

  // The id comes from the URL, so it is encoded before it ever reaches a link.
  const safeId = decodeURIComponent(conversationId);

  return (
    <div className="mx-auto h-[calc(100dvh-4rem)] w-full max-w-6xl px-3 py-3 sm:px-5 lg:px-6 lg:py-5">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        {/* Desktop: list stays visible beside the thread.
            Mobile: hidden, because tapping a row navigates here and the thread
            should own the whole screen. */}
        <div className="hidden min-h-0 overflow-hidden lg:block lg:border-r lg:border-slate-200/80">
          <ConversationListPane activeConversationId={safeId} />
        </div>

        <div className="min-h-0">
          <MessageThread
            conversationId={safeId}
            onBack={() => router.push("/messages")}
          />
        </div>
      </div>
    </div>
  );
}
