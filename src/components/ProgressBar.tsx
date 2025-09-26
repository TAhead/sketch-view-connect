import { cn } from "@/lib/utils";

interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface ProgressBarProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressBar({ steps, className }: ProgressBarProps) {
  return (
    <div className={cn("bg-card border-t-2 border-border p-4", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-3">
        Progress Bar
      </div>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "status-bar-step text-xs flex-1 text-center min-w-0",
              {
                "status-bar-pending": step.status === 'pending',
                "status-bar-active": step.status === 'active',
                "status-bar-completed": step.status === 'completed',
              }
            )}
          >
            <div className="truncate">{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}