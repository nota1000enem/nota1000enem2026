import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

interface LazyOnVisibleProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Distance from viewport to start loading. Default: 600px */
  rootMargin?: string;
  /** Minimum reserved height to avoid CLS while not yet loaded */
  minHeight?: number | string;
}

/**
 * Renders its children only once the sentinel scrolls near the viewport.
 * Wrap React.lazy components inside to defer chunk download + render.
 */
export function LazyOnVisible({
  children,
  fallback = null,
  rootMargin = "600px",
  minHeight = 400,
}: LazyOnVisibleProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
