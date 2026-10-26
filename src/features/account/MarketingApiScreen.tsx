"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import {
  apiErrorMessage,
  marketerApi,
  type MarketingApiSettings,
} from "@/src/lib/api";
import {
  BottomSheet,
  Button,
  ErrorState,
  PageSkeleton,
  PageTitle,
  Panel,
  StatusChip,
} from "@/src/components/ui/primitives";

const settingsKey = ["marketing-api-settings"];

export function MarketingApiScreen() {
  const queryClient = useQueryClient();
  const [secret, setSecret] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const settings = useQuery({
    queryKey: settingsKey,
    queryFn: marketerApi.marketingApiSettings,
  });
  const rotate = useMutation({
    mutationFn: marketerApi.rotateMarketingApiKey,
    gcTime: 0,
    onSuccess: (result) => {
      setSecret(result.apiKey);
      setCopied(null);
      setConfirmOpen(false);
      queryClient.setQueryData<MarketingApiSettings>(settingsKey, (current) =>
        current
          ? {
              ...current,
              hasKey: true,
              keySuffix: result.keySuffix,
              createdAt: result.createdAt,
            }
          : current,
      );
    },
  });

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setCopyError("");
    } catch {
      setCopyError(
        "Nusxalash amalga oshmadi. Matnni belgilab, qo'lda nusxalang.",
      );
    }
  }

  if (settings.isPending) return <PageSkeleton />;
  if (!settings.data)
    return (
      <ErrorState
        description={apiErrorMessage(settings.error)}
        retry={() => void settings.refetch()}
      />
    );
  const data = settings.data;
  const streamID = Number(selectedStream || data.streams[0]?.streamID || 1001);
  const payload = JSON.stringify(
    {
      name: "Ali Valiyev",
      phoneNumber: "+998 (90) 123-45-67",
      streamID,
      source: "facebook",
    },
    null,
    2,
  );
  const curl = [
    `curl -X POST '${data.endpoint}' \\`,
    `  -H 'X-API-Key: YOUR_API_KEY' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${payload}'`,
  ].join("\n");

  return (
    <div className="space-y-3">
      <Link
        href="/account"
        className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Hisob
      </Link>
      <PageTitle
        eyebrow="Integratsiyalar"
        title="Marketing API"
        description="Reklamadan kelgan leadlarni to'g'ridan-to'g'ri operatorlarga yuboring."
      />

      <Panel className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <KeyRound className="h-4 w-4 text-[var(--brand)]" /> API kalit
          </h2>
          <StatusChip tone={data.hasKey ? "success" : "neutral"}>
            {data.hasKey ? "Faol" : "Yaratilmagan"}
          </StatusChip>
        </div>
        {secret ? (
          <div className="space-y-2 rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft)] p-3">
            <p className="text-xs font-bold text-[var(--brand)]">
              Yangi kalit faqat shu safar ko&apos;rsatiladi. Uni hozir saqlab
              oling.
            </p>
            <code className="block break-all text-xs select-all">{secret}</code>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => void copy("key", secret)}
            >
              {copied === "key" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "key" ? "Nusxalandi" : "Kalitni nusxalash"}
            </Button>
          </div>
        ) : data.hasKey ? (
          <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 font-mono text-sm">
            ••••••••••••{data.keySuffix}
          </div>
        ) : null}
        {data.createdAt && (
          <p className="text-[11px] text-[var(--muted)]">
            Yangilangan:{" "}
            {new Date(data.createdAt).toLocaleString("uz-UZ", {
              timeZone: "Asia/Tashkent",
            })}
          </p>
        )}
        <p className="text-xs leading-5 text-[var(--muted)]">
          Kalitni faqat ishonchli integratsiyaga kiriting. Yangilash avvalgi
          kalitni darhol bekor qiladi.
        </p>
        <Button
          variant={data.hasKey ? "secondary" : "primary"}
          className="w-full"
          loading={rotate.isPending}
          onClick={() => {
            rotate.reset();
            if (data.hasKey) setConfirmOpen(true);
            else rotate.mutate();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          {data.hasKey ? "Kalitni yangilash" : "API kalit yaratish"}
        </Button>
        {rotate.isError && (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {apiErrorMessage(rotate.error)}
          </p>
        )}
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-extrabold">So&apos;rov yuborish</h2>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
          <span className="text-[10px] font-black text-[var(--brand)]">
            POST
          </span>
          <code className="mt-1 block break-all text-xs select-all">
            {data.endpoint}
          </code>
        </div>
        {data.streams.length ? (
          <label className="block text-xs font-bold">
            Stream
            <select
              value={selectedStream || String(data.streams[0].streamID)}
              onChange={(event) => setSelectedStream(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
            >
              {data.streams.map((stream) => (
                <option key={stream.streamID} value={stream.streamID}>
                  #{stream.streamID} · {stream.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-xs leading-5 text-[var(--muted)]">
            Faol forma streami yo&apos;q.{" "}
            <Link
              href="/referrals"
              className="font-bold text-[var(--brand)] underline"
            >
              Referallar
            </Link>{" "}
            bo&apos;limida forma turidagi referal yarating. Namunadagi 1001
            o&apos;rniga uning stream ID sini kiriting.
          </p>
        )}
        <p className="text-xs leading-5 text-[var(--muted)]">
          Header: <code>X-API-Key</code>. Quyidagi namunada{" "}
          <code>YOUR_API_KEY</code> ni kalitingiz bilan almashtiring. Faqat
          o&apos;zingizning faol streamlaringizga lead yuborishingiz mumkin.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">
          <code>{curl}</code>
        </pre>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void copy("request", curl)}
        >
          <Copy className="h-4 w-4" />
          {copied === "request" ? "Nusxalandi" : "Namunani nusxalash"}
        </Button>
        {copyError && (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {copyError}
          </p>
        )}
      </Panel>

      <Panel className="space-y-3 p-4 text-xs leading-5">
        <h2 className="text-sm font-extrabold">Qanday ishlaydi?</h2>
        <p>
          <code>name</code>, <code>phoneNumber</code> va <code>streamID</code>{" "}
          majburiy. <code>source</code> ixtiyoriy: masalan, facebook yoki
          instagram.
        </p>
        <p className="text-[var(--muted)]">
          Telefonning oxirgi 9 ta raqami olinadi:{" "}
          <span className="whitespace-nowrap font-bold text-[var(--ink)]">
            +998 90 123 45 67
          </span>
          . 9 tadan kam raqam bo&apos;lsa, lead qabul qilinmaydi. Mavjud mijoz
          topiladi yoki yangi mijoz yaratiladi. Leadni keyin operator qayta
          ishlaydi.
        </p>
        <div className="grid grid-cols-[36px_1fr] gap-x-3 gap-y-1 border-t border-[var(--line)] pt-3 text-[var(--muted)]">
          <code className="text-[var(--brand)]">201</code>
          <span>Lead qabul qilindi · status: received</span>
          <code>400</code>
          <span>Ism, telefon yoki stream ID yaroqsiz</span>
          <code>401</code>
          <span>API kalit yaroqsiz yoki yangilangan</span>
          <code>404</code>
          <span>Faol stream topilmadi yoki sizga tegishli emas</span>
        </div>
        <p className="text-[var(--muted)]">
          Facebook Lead Ads / CRM integratsiyasida ism va telefon maydonlarini
          shu formatga moslang. Bu endpoint JSON so&apos;rovlarni qabul qiladi.
        </p>
      </Panel>

      <BottomSheet
        open={confirmOpen}
        onClose={() => {
          if (!rotate.isPending) setConfirmOpen(false);
        }}
        title="API kalit yangilansinmi?"
        description="Eski kalit darhol ishlashdan to'xtaydi. Ulangan platformalarga yangi kalitni kiritish kerak bo'ladi."
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={rotate.isPending}
            onClick={() => setConfirmOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button loading={rotate.isPending} onClick={() => rotate.mutate()}>
            Yangilash
          </Button>
        </div>
        {rotate.isError && (
          <p role="alert" className="mt-3 text-xs text-[var(--danger)]">
            {apiErrorMessage(rotate.error)}
          </p>
        )}
      </BottomSheet>
    </div>
  );
}
