/**
 * Home page - Dashboard overview with recent tests and quick actions.
 */

import { Link } from "react-router-dom";
import { RiAddLine, RiHistoryLine } from "@remixicon/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Agentic LLM Testing Framework — Minecraft Environment"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quick Action: New Test */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Test</CardTitle>
            <CardDescription>
              Configure a new adversarial test scenario with custom agent profiles and LLM targets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tests/new">
              <Button className="w-full gap-1.5">
                <RiAddLine className="size-3.5" data-icon="inline-start" />
                New Test Run
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Action: View History */}
        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              Browse previous test runs, view results, and compare LLM performance across scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/tests">
              <Button variant="outline" className="w-full gap-1.5">
                <RiHistoryLine className="size-3.5" data-icon="inline-start" />
                View All Tests
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Backend services and connection health overview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Server</span>
                <span className="text-primary font-medium">Checking...</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minecraft</span>
                <span className="text-muted-foreground font-medium">--</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discord</span>
                <span className="text-muted-foreground font-medium">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
