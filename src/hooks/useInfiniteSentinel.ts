"use client";

import { useEffect, useRef } from "react";

export function useInfiniteSentinel(
  enabled: boolean,
  loadMore: () => void,
) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, loadMore]);

  return ref;
}

