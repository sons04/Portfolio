import React from "react";
import { clsx } from "clsx";

interface FadeProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * Wrapper that transitions opacity + translateY on mount/active changes.
 * Uses CSS transitions; no external animation library.
 */
export function Fade({
  children,
  active = true,
  className
}: FadeProps) {
  return (
    <div
      className={clsx(
        "fade",
        active && "fade--active",
        className
      )}
    >
      {children}
    </div>
  );
}
