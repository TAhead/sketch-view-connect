import { Bot } from "lucide-react";

export function BuddyLogo() {
  return (
    <div className="flex items-center justify-center p-4 bg-card border-2 border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <div className="text-xl font-bold text-foreground">
          Buddy<br />
          <span className="text-sm font-normal text-muted-foreground">Lab System</span>
        </div>
      </div>
    </div>
  );
}