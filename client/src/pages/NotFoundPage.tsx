/**
 * 404 Not Found page.
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine } from "@remixicon/react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="text-muted-foreground text-6xl font-bold">404</div>
      <p className="text-muted-foreground text-sm">Page not found</p>
      <Link to="/">
        <Button variant="outline" size="sm" className="gap-1.5">
          <RiArrowLeftLine className="size-3.5" data-icon="inline-start" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
