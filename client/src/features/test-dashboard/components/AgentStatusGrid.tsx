/**
 * Grid showing each agent in the test; displays "In game" for all.
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { RiRobotLine } from "@remixicon/react";
import { AgentProfileBadge } from "@/components/shared/AgentProfileBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { BehavioralProfile } from "@/types/agent";

function AgentStatusGrid({ profiles }: { profiles: BehavioralProfile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-dashboard="agents-in-game">
          <RiRobotLine className="size-4 text-primary" />
          Agents
          <span className="text-muted-foreground font-normal text-xs">(in game)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profiles.length === 0 ? (
          <EmptyState
            icon={RiRobotLine}
            title="No agents"
            description="Agents will appear when the test initializes"
          />
        ) : (
          <div className="space-y-2">
            {profiles.map((profile, i) => (
              <div
                key={`${profile}-${i}`}
                className="ring-foreground/10 flex items-center justify-between gap-2 rounded-none p-2 ring-1"
              >
                <AgentProfileBadge profile={profile} />
                <span className="text-muted-foreground text-xs">In game</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { AgentStatusGrid };
