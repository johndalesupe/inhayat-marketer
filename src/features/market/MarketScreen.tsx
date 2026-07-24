"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  Check,
  Clipboard,
  Filter,
  Link2,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { clsx } from "clsx";
import {
  useCreateReferral,
  useProductCategories,
  useProducts,
  useTopProducts,
} from "@/src/hooks/useMarketerQueries";
import { useInfiniteSentinel } from "@/src/hooks/useInfiniteSentinel";
import {
  apiErrorMessage,
  createIdempotencyKey,
} from "@/src/lib/api";
import { formatMoney } from "@/src/lib/format";
import type {
  MarketerProduct,
  MarketerReferral,
} from "@/src/types/marketer";
import { useTelegram } from "@/src/telegram/TelegramProvider";
import { ProductImage } from "@/src/components/ui/ProductImage";
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  FieldError,
  IconButton,
  PageTitle,
  SectionHeading,
  Skeleton,
  inputClass,
} from "@/src/components/ui/primitives";

const referralSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3, "Nom kamida 3 ta belgidan iborat bo'lsin")
    .max(80, "Nom 80 ta belgidan oshmasin")
    .required("Referal nomini kiriting"),
});
type ReferralForm = yup.InferType<typeof referralSchema>;

const sortOptions = [
  { value: "popular", label: "Ommabop" },
  { value: "newest", label: "Yangi" },
  { value: "price_desc", label: "Narxi yuqori" },
  { value: "price_asc", label: "Narxi past" },
];

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function ProductCard({
  product,
  topRank,
  onCreate,
}: {
  product: MarketerProduct;
  topRank?: number;
  onCreate: (product: MarketerProduct) => void;
}) {
  const price =
    product.discountPrice != null && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  return (
    <article className="min-w-0 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)]">
      <div className="relative">
        <ProductImage
          src={product.thumbnailUrl}
          alt={product.nameUz}
          className="aspect-[3/4] w-full"
        />
        {topRank != null && (
          <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/40 bg-[var(--brand)] px-1.5 text-[11px] font-black text-white">
            #{topRank}
          </span>
        )}
        {!product.isAvailable && (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 px-2 py-1.5 text-center text-[10px] font-extrabold text-white">
            Hozir mavjud emas
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 min-h-9 text-xs font-extrabold leading-[18px] text-[var(--ink)]">
          {product.nameUz}
        </p>
        <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">
          {formatMoney(price)}
        </p>
        <div className="mt-2 rounded-lg bg-[var(--brand-soft)] px-2 py-1.5">
          <p className="text-[9px] font-bold text-[var(--muted)]">
            Taxminiy bonus
          </p>
          <p className="mt-0.5 text-xs font-black text-[var(--brand)]">
            +{formatMoney(product.expectedBonus)}
          </p>
        </div>
        <Button
          variant="secondary"
          className="mt-2.5 min-h-10 w-full px-2 text-[11px] text-[var(--brand)]"
          disabled={!product.isAvailable}
          onClick={() => onCreate(product)}
        >
          <Link2 className="h-3.5 w-3.5" />
          Referal yaratish
        </Button>
      </div>
    </article>
  );
}

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)]"
        >
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-2 p-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralSheet({
  product,
  onClose,
}: {
  product: MarketerProduct;
  onClose: () => void;
}) {
  const mutation = useCreateReferral();
  const { haptic, openTelegramLink } = useTelegram();
  const [copied, setCopied] = useState(false);
  const form = useForm<ReferralForm>({
    resolver: yupResolver(referralSchema),
    defaultValues: { name: `${product.nameUz} uchun havola` },
  });

  const created = mutation.data as MarketerReferral | undefined;
  const close = () => {
    form.reset();
    mutation.reset();
    onClose();
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title={created ? "Referal tayyor" : "Yangi referal"}
      description={
        created
          ? "Havolani nusxalang yoki Telegram orqali ulashing."
          : "Natijalarni keyin aynan shu nom orqali ajrata olasiz."
      }
    >
      {!created && (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] p-3">
            <ProductImage
              src={product.thumbnailUrl}
              alt={product.nameUz}
              className="h-16 w-12 shrink-0 rounded-lg"
              sizes="48px"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-extrabold text-[var(--ink)]">
                {product.nameUz}
              </p>
              <p className="mt-1 text-xs font-black text-[var(--brand)]">
                Har bir buyurtmadan taxminan{" "}
                {formatMoney(product.expectedBonus)}
              </p>
            </div>
          </div>
          <form
            className="mt-4"
            onSubmit={form.handleSubmit((values) => {
              mutation.mutate(
                {
                  name: values.name.trim(),
                  productId: product.id,
                  idempotencyKey: createIdempotencyKey(),
                },
                {
                  onSuccess: () => haptic("success"),
                  onError: () => haptic("error"),
                },
              );
            })}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-[var(--ink)]">
                Referal nomi
              </span>
              <input
                {...form.register("name")}
                className={inputClass}
                placeholder="Masalan: Instagram — iyul"
                autoComplete="off"
              />
              <FieldError message={form.formState.errors.name?.message} />
            </label>
            {mutation.isError && (
              <p className="mt-3 rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
                {apiErrorMessage(mutation.error, "Referal yaratilmadi")}
              </p>
            )}
            <Button
              type="submit"
              loading={mutation.isPending}
              className="mt-4 w-full"
            >
              <Sparkles className="h-4 w-4" />
              Havolani yaratish
            </Button>
          </form>
        </>
      )}

      {created && (
        <div>
          <div className="rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--success)] text-white">
              <Check className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-black text-[var(--ink)]">
              {created.name}
            </p>
            <p className="mt-1 break-all text-xs font-semibold leading-5 text-[var(--muted)]">
              {created.link}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await copyText(created.link);
                setCopied(true);
                haptic("success");
              }}
            >
              <Clipboard className="h-4 w-4" />
              {copied ? "Nusxalandi" : "Nusxalash"}
            </Button>
            <Button
              onClick={() => {
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
                  created.link,
                )}&text=${encodeURIComponent(created.product.nameUz)}`;
                openTelegramLink(shareUrl);
                haptic("light");
              }}
            >
              <Send className="h-4 w-4" />
              Ulashish
            </Button>
          </div>
          <Button variant="ghost" className="mt-2 w-full" onClick={close}>
            Tayyor
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

export function MarketScreen() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [sort, setSort] = useState("popular");
  const [categoryId, setCategoryId] = useState("");
  const [available, setAvailable] = useState<boolean | null>(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<MarketerProduct | null>(null);
  const topQuery = useTopProducts();
  const categoriesQuery = useProductCategories();
  const productsQuery = useProducts({
    search: deferredSearch,
    sort,
    categoryId,
    available,
  });
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );
  const loadMore = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }, [productsQuery]);
  const sentinel = useInfiniteSentinel(
    Boolean(productsQuery.hasNextPage && !productsQuery.isFetchingNextPage),
    loadMore,
  );
  const activeFilterCount =
    Number(sort !== "popular") +
    Number(Boolean(categoryId)) +
    Number(available !== true);

  return (
    <div className="space-y-4">
      <PageTitle
        eyebrow="Mahsulotlar bozori"
        title="Sotishga tayyor mahsulotlar"
        description="Mahsulotni tanlang va kuzatiladigan shaxsiy havola yarating."
      />

      {!deferredSearch && !categoryId && (
        <section>
          <SectionHeading
            title="Top mahsulotlar"
            caption="Hozir eng yaxshi natija ko'rsatayotganlar"
          />
          <div className="mt-2.5">
            {topQuery.isLoading ? (
              <ProductGridSkeleton count={4} />
            ) : topQuery.isError ? (
              <ErrorState
                description={apiErrorMessage(topQuery.error)}
                retry={() => void topQuery.refetch()}
              />
            ) : topQuery.data?.length ? (
              <div className="grid grid-cols-2 gap-2.5">
                {topQuery.data.slice(0, 4).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    topRank={product.rank ?? index + 1}
                    onCreate={setSelectedProduct}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Top ro'yxat shakllanmoqda"
                description="Yetarli savdo ma'lumoti yig'ilganda top mahsulotlar shu yerda chiqadi."
              />
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="Barcha mahsulotlar"
          caption="Qidiruv va filtr bilan aniq mahsulotni toping"
        />
        <div className="mt-2.5 flex gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={clsx(inputClass, "pl-9 pr-3")}
              placeholder="Nomi yoki ID bo'yicha"
              enterKeyHint="search"
            />
          </label>
          <IconButton
            label="Filtrlar"
            onClick={() => setFilterOpen(true)}
            className="relative h-12 w-12"
          >
            <Filter className="h-4.5 w-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </IconButton>
        </div>

        {categoriesQuery.data?.length ? (
          <div className="-mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
            <button
              onClick={() => setCategoryId("")}
              className={clsx(
                "h-9 shrink-0 rounded-full border px-3 text-[11px] font-extrabold",
                !categoryId
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
              )}
            >
              Barchasi
            </button>
            {categoriesQuery.data.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                className={clsx(
                  "h-9 shrink-0 rounded-full border px-3 text-[11px] font-extrabold",
                  categoryId === category.id
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-3">
          {productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError ? (
            <ErrorState
              description={apiErrorMessage(productsQuery.error)}
              retry={() => void productsQuery.refetch()}
            />
          ) : products.length ? (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCreate={setSelectedProduct}
                  />
                ))}
              </div>
              <div ref={sentinel} className="h-4" />
              {productsQuery.isFetchingNextPage && (
                <div className="mt-2">
                  <ProductGridSkeleton count={2} />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="Mahsulot topilmadi"
              description="Qidiruv so'zi yoki filtrlarni o'zgartirib ko'ring."
              icon={Search}
            />
          )}
        </div>
      </section>

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Mahsulot filtrlari"
        description="Ro'yxatni auditoriyangizga moslab saralang."
      >
        <div>
          <p className="text-xs font-extrabold text-[var(--ink)]">Saralash</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSort(option.value)}
                className={clsx(
                  "flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-xs font-extrabold",
                  sort === option.value
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--line)] text-[var(--muted)]",
                )}
              >
                {option.label}
                {sort === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-extrabold text-[var(--ink)]">Mavjudlik</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setAvailable(true)}
              className={clsx(
                "min-h-11 rounded-xl border px-3 text-xs font-extrabold",
                available === true
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] text-[var(--muted)]",
              )}
            >
              Sotuvda bor
            </button>
            <button
              onClick={() => setAvailable(null)}
              className={clsx(
                "min-h-11 rounded-xl border px-3 text-xs font-extrabold",
                available === null
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] text-[var(--muted)]",
              )}
            >
              Barchasi
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSort("popular");
              setCategoryId("");
              setAvailable(true);
            }}
          >
            Tozalash
          </Button>
          <Button onClick={() => setFilterOpen(false)}>
            <SlidersHorizontal className="h-4 w-4" />
            Natijalarni ko’rish
          </Button>
        </div>
      </BottomSheet>

      {selectedProduct && (
        <ReferralSheet
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
