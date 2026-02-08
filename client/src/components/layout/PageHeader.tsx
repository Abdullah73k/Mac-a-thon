/**
 * Reusable page header component with title, description, and optional action.
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-foreground text-lg font-semibold">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
