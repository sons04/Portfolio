import React from "react";
import { clsx } from "clsx";

interface PillProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function Pill({ children, className, size = "md" }: PillProps) {
  return (
    <span
      className={clsx(
        "pill",
        size === "sm" && "pill--sm",
        className
      )}
    >
      {children}
    </span>
  );
}
