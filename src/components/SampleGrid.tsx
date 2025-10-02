import { cn } from "@/lib/utils";

interface SampleGridProps {
  samples: boolean[][];
  className?: string;
}

export function SampleGrid({ samples, className }: SampleGridProps) {
  return (
    <div className={cn("border-2 border-border rounded-lg p-4 bg-card", className)}>
      <div className="grid grid-cols-5 gap-3">
        {samples.flat().map((filled, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-8 rounded-full transition-all duration-200",
              filled ? "sample-filled" : "sample-empty"
            )}
          />
        ))}
      </div>
    </div>
  );
}