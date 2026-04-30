import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass rounded-2xl", className)}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass-strong rounded-3xl", className)}
      {...props}
    />
  ),
);
GlassPanel.displayName = "GlassPanel";
