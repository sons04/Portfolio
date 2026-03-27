import React from "react";
import { clsx } from "clsx";

type GlassCardVariant = "hero" | "panel" | "compact";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: GlassCardVariant;
  as?: "div" | "article" | "section";
}

const variantStyles: Record<GlassCardVariant, string> = {
  hero: "glass-card--hero",
  panel: "glass-card--panel",
  compact: "glass-card--compact"
};

export function GlassCard({
  title,
  subtitle,
  children,
  className,
  variant = "panel",
  as: Component = "div"
}: GlassCardProps) {
  return (
    <Component
      className={clsx(
        "glass-card",
        variantStyles[variant],
        className
      )}
    >
      <div className="glass-card__inner">
        {(title || subtitle) && (
          <div className="glass-card__header">
            {title && <h3 className="glass-card__title">{title}</h3>}
            {subtitle && <p className="glass-card__subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="glass-card__body">{children}</div>
      </div>
    </Component>
  );
}
