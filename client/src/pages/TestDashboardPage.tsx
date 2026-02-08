/**
 * Live test monitoring dashboard page.
 */

import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";

export default function TestDashboardPage() {
  const { testId } = useParams<{ testId: string }>();

  return (
    <>
      <PageHeader
        title={`Test: ${testId ?? "Unknown"}`}
        description="Real-time test monitoring dashboard"
      />
      <div className="text-muted-foreground text-sm">
        Live dashboard will be implemented here.
      </div>
    </>
  );
}
