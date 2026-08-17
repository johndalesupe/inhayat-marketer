"use client";

import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/src/components/ui/ProductImage";

export function ProductMediaCarousel({
  images,
  thumbnailUrl,
  title,
}: {
  images: string[];
  thumbnailUrl?: string | null;
  title: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const selectorRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const media = useMemo(
    () =>
      [...new Set([thumbnailUrl, ...images].filter(Boolean) as string[])],
    [images, thumbnailUrl],
  );

  useEffect(() => {
    selectorRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  const moveTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), Math.max(media.length - 1, 0));
    viewportRef.current?.scrollTo({
      left: viewportRef.current.clientWidth * next,
      behavior: "smooth",
    });
    setActiveIndex(next);
  };

  if (!media.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[22px] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
        <div className="text-center">
          <Images className="mx-auto h-7 w-7" />
          <p className="mt-2 text-xs font-bold">Rasm mavjud emas</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Mahsulot rasmlari">
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)]">
        <div
          ref={viewportRef}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const viewport = event.currentTarget;
            if (!viewport.clientWidth) return;
            setActiveIndex(
              Math.min(
                media.length - 1,
                Math.max(0, Math.round(viewport.scrollLeft / viewport.clientWidth)),
              ),
            );
          }}
        >
          {media.map((url, index) => (
            <div key={url} className="w-full shrink-0 snap-center">
              <ProductImage
                src={url}
                alt={`${title}, ${index + 1}-rasm`}
                className="aspect-[4/5] w-full"
                sizes="(max-width: 560px) 100vw, 560px"
              />
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-extrabold tabular-nums text-[var(--ink)] backdrop-blur-sm">
              {activeIndex + 1} / {media.length}
            </span>
            <button
              type="button"
              aria-label="Oldingi rasm"
              disabled={activeIndex === 0}
              onClick={() => moveTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--ink)] backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:opacity-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Keyingi rasm"
              disabled={activeIndex === media.length - 1}
              onClick={() => moveTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--ink)] backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] disabled:opacity-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div
          className="mx-auto mt-2 flex max-w-full snap-x gap-0.5 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Rasm tanlash"
        >
          {media.map((url, index) => (
            <button
              key={url}
              ref={(node) => {
                selectorRefs.current[index] = node;
              }}
              type="button"
              aria-label={`${index + 1}-rasmni ko'rsatish`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => moveTo(index)}
              className="flex h-11 w-11 shrink-0 snap-center items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index
                    ? "w-6 bg-[var(--brand)]"
                    : "w-1.5 bg-[var(--line-strong)]"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
