import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

interface FadeProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  triggerOnView?: boolean;
}

/**
 * Wrapper that transitions opacity + translateY on mount/active changes.
 * Uses CSS transitions; no external animation library.
 */
export function Fade({
  children,
  active = true,
  className,
  triggerOnView = false
}: FadeProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(!triggerOnView);

  useEffect(() => {
    if (!triggerOnView) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [triggerOnView]);

  return (
    <div
      ref={ref}
      className={clsx(
        "fade",
        active && isVisible && "fade--active",
        className
      )}
    >
      {children}
    </div>
  );
}
