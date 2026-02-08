/**
 * Test history page - List of all test runs.
 */

import { Link } from "react-router-dom";
import { RiAddLine } from "@remixicon/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export default function TestHistoryPage() {
  return (
    <>
      <PageHeader
        title="Test History"
        description="Browse all test runs and their results"
        action={
          <Link to="/tests/new">
            <Button size="sm" className="gap-1.5">
              <RiAddLine className="size-3.5" data-icon="inline-start" />
              New Test
            </Button>
          </Link>
        }
      />
      <div className="text-muted-foreground text-sm">
        Test history table will be implemented here.
      </div>
    </>
  );
}
