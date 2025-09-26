import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ControlButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ControlButton({ 
  children, 
  variant = 'default', 
  size = 'default',
  icon: Icon,
  onClick,
  disabled,
  className 
}: ControlButtonProps) {
  const variantStyles = {
    default: "bg-primary hover:bg-primary/90 text-primary-foreground",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    success: "bg-success hover:bg-success/90 text-success-foreground",
    warning: "bg-warning hover:bg-warning/90 text-warning-foreground",
    destructive: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={cn(
        "font-medium transition-all duration-200 shadow-sm hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
}