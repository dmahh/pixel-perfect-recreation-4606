import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapProps } from "./map-types";

const AstanaMap = lazy(() => import("./AstanaMap"));

function MapSkeleton() {
  return (
    <div className="blueprint flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <span className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 animate-pulse" /> Loading map of Astana…
      </span>
    </div>
  );
}

export function MapView({ className, ...props }: MapProps & { className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl border bg-muted", className)}>
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <AstanaMap {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
