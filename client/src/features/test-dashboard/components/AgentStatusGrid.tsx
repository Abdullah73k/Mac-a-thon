/**
 * Grid showing the status and profile of each agent in the test.
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { RiRobotLine } from "@remixicon/react";
import { AgentProfileBadge } from "@/components/shared/AgentProfileBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { BotState } from "@/types/bot";
import type { BehavioralProfile } from "@/types/agent";

function AgentStatusGrid({
  profiles,
  bots,
}: {
  profiles: BehavioralProfile[];
  bots: Map<string, BotState>;
}) {
  const botList = Array.from(bots.values());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiRobotLine className="size-4 text-primary" />
          Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profiles.length === 0 && botList.length === 0 ? (
          <EmptyState
            icon={RiRobotLine}
            title="No agents"
            description="Agents will appear when the test initializes"
          />
        ) : (
          <div className="space-y-2">
            {/* Show profiles with matched bots */}
            {profiles.map((profile, i) => {
              const bot = botList[i];
              return (
                <div
                  key={`${profile}-${i}`}
                  className="ring-foreground/10 flex items-center justify-between gap-2 rounded-none p-2 ring-1"
                >
                  <AgentProfileBadge profile={profile} />
                  <div className="flex items-center gap-2 text-xs">
                    {bot && (
                      <>
                        <span className="text-muted-foreground">
                          {bot.username}
                        </span>
                        <StatusBadge domain="bot" status={bot.status} />
                        {bot.health !== null && (
                          <span className="tabular-nums text-[10px] text-muted-foreground">
                            HP:{bot.health}
                          </span>
                        )}
                      </>
                    )}
                    {!bot && (
                      <span className="text-muted-foreground text-[10px]">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { AgentStatusGrid };
