import Link from "next/link";
import { ArrowLeft, MapPinOff } from "lucide-react";
import { Panel } from "@/src/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] items-center">
      <Panel className="w-full px-5 py-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]">
          <MapPinOff className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-[var(--ink)]">
          Sahifa topilmadi
        </h1>
        <p className="mt-1.5 text-sm font-medium text-[var(--muted)]">
          Havola eskirgan yoki noto’g’ri bo’lishi mumkin.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Bosh sahifaga qaytish
        </Link>
      </Panel>
    </div>
  );
}
