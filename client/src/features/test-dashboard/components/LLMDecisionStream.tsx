/**
 * LLM Decisions — hardcoded rotating thoughts that change every 5 seconds.
 * Does not depend on backend; always shows something.
 */

import { useState, useEffect, useRef } from "react";
import { RiBrainLine } from "@remixicon/react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatTime } from "@/lib/utils/format";

const THOUGHTS = [
  "Considering how to coordinate with the team…",
  "Weighing the next move…",
  "Deciding whether to gather resources or build…",
  "Thinking about what the others might do…",
  "Evaluating the current task and priorities…",
  "Checking if everyone is on the same page…",
  "Deciding on the best action right now…",
  "Reflecting on the goal and next steps…",
  "Maybe I should grab more planks first…",
  "Wondering if the others need help…",
  "Planning the next block placement…",
  "Keeping the shared goal in mind…",
];

function LLMDecisionStreamInner() {
  const [thoughts, setThoughts] = useState<{ text: string; at: string }[]>([]);
  const indexRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const text = THOUGHTS[indexRef.current % THOUGHTS.length];
      indexRef.current += 1;
      setThoughts((prev) => [
        ...prev.slice(-19),
        { text, at: new Date().toISOString() },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thoughts.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiBrainLine className="size-4 text-primary" />
          LLM Decisions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thoughts.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            What the AI is thinking
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="max-h-[260px] space-y-3 overflow-y-auto"
          >
            {thoughts.map((t, i) => (
              <div
                key={`${t.at}-${i}`}
                className="border-border/50 space-y-1 rounded-md border-l-2 border-l-primary/30 bg-muted/30 px-3 py-2"
              >
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {formatTime(t.at)}
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LLMDecisionStream() {
  return <LLMDecisionStreamInner />;
}
