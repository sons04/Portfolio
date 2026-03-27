import React from "react";
import { clsx } from "clsx";

interface IconButtonProps {
  children: React.ReactNode;
  className?: string;
  "aria-label": string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function IconButton({
  children,
  className,
  "aria-label": ariaLabel,
  onClick,
  type = "button",
  disabled = false
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={clsx("icon-btn", className)}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
