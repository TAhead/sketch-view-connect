import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusMessageProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  className?: string;
}

export function StatusMessage({ type, title, message, className }: StatusMessageProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: CheckCircle,
  };
  
  const Icon = icons[type];
  
  const variants = {
    info: "border-primary/20 bg-primary/5 text-primary",
    warning: "border-warning/20 bg-warning/5 text-warning-foreground",
    error: "border-error/20 bg-error/5 text-error-foreground",
    success: "border-success/20 bg-success/5 text-success-foreground",
  };

  return (
    <div className={cn(
      "border-2 rounded-lg p-4 flex items-start gap-3",
      variants[type],
      className
    )}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        {title && (
          <div className="font-semibold">
            {type === 'error' && 'Error: '}
            {title}
          </div>
        )}
        <div className={title ? "text-sm" : ""}>{message}</div>
      </div>
    </div>
  );
}