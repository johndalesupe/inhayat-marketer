import { Skeleton } from "@/src/components/ui/primitives";

export default function ProductDetailsLoading() {
  return (
    <div className="space-y-3" aria-label="Mahsulot yuklanmoqda" aria-busy>
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-[14px]" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-11 w-11 rounded-[14px]" />
      </div>
      <Skeleton className="aspect-[4/5] w-full rounded-[22px]" />
      <div className="space-y-2 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
