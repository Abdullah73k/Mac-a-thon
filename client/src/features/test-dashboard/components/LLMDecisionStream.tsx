/**
 * Shows "what the agent is thinking" — driven by chat feed.
 * Each agent message appears as a thought; count increases with each message.
 */

import { useRef, useEffect, memo } from "react";
import { RiBrainLine } from "@remixicon/react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTime } from "@/lib/utils/format";
import type { TestChatMessage } from "@/hooks/use-test-websocket";

function LLMDecisionStreamInner({
  chatMessages,
}: {
  chatMessages: TestChatMessage[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiBrainLine className="size-4 text-primary" />
          LLM Decisions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chatMessages.length === 0 ? (
          <EmptyState
            icon={RiBrainLine}
            title="What the agent might be thinking"
            description="Agent thoughts will appear here as they chat during the test"
          />
        ) : (
          <div
            ref={scrollRef}
            className="max-h-[260px] space-y-2 overflow-y-auto"
          >
            {chatMessages.map((msg, i) => (
              <div
                key={`${msg.timestamp}-${i}`}
                className="ring-foreground/5 space-y-1 rounded-none p-2 ring-1"
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="tabular-nums">{formatTime(msg.timestamp)}</span>
                  <span>{msg.agentId}</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {msg.message.length > 300
                    ? msg.message.slice(0, 300) + "..."
                    : msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const LLMDecisionStream = memo(LLMDecisionStreamInner);

export { LLMDecisionStream };
