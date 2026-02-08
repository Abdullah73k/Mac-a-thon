/**
 * Completed test results page.
 */

import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";

export default function TestResultsPage() {
  const { testId } = useParams<{ testId: string }>();

  return (
    <>
      <PageHeader
        title={`Results: ${testId ?? "Unknown"}`}
        description="Test results and performance analysis"
      />
      <div className="text-muted-foreground text-sm">
        Results view will be implemented here.
      </div>
    </>
  );
}
