/**
 * Test creation page - Multi-step wizard for configuring a new test.
 */

import { PageHeader } from "@/components/layout/PageHeader";

export default function CreateTestPage() {
  return (
    <>
      <PageHeader
        title="Create Test"
        description="Configure a new adversarial test scenario"
      />
      <div className="text-muted-foreground text-sm">
        Test creation wizard will be implemented here.
      </div>
    </>
  );
}
