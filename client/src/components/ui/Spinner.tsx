import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-indigo-500", className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
