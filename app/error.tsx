"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, Panel } from "@/src/components/ui/primitives";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketer Mini App route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center">
      <Panel className="w-full px-5 py-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] border border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-[var(--ink)]">
          Sahifada xatolik yuz berdi
        </h1>
        <p className="mt-1.5 text-sm font-medium leading-5 text-[var(--muted)]">
          Ma’lumotlaringiz saqlanib qoladi. Sahifani qayta yuklab ko’ring.
        </p>
        <Button className="mt-5 w-full" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Qayta yuklash
        </Button>
      </Panel>
    </div>
  );
}
