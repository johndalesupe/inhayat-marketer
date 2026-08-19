"use client";

import {
  AlertCircle,
  Inbox,
  LoaderCircle,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      className={clsx(
        "rounded-[8px] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  loading = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  const variants = {
    primary:
      "border-[var(--brand)] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] active:bg-[var(--brand-strong)]",
    secondary:
      "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised)] active:bg-[var(--surface-muted)]",
    danger:
      "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)] hover:border-[var(--danger)] active:bg-[var(--danger-line)]",
    ghost:
      "border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)]",
  };

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[8px] border px-4 text-sm font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
}) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition duration-150 hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] active:scale-95 disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-0.5 py-0.5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--brand)]">
            <span className="h-px w-4 bg-[var(--line-strong)]" />
            <span>{eyebrow}</span>
          </p>
        )}
        <h1 className="text-[22px] font-extrabold leading-[1.2] tracking-[-0.032em] text-[var(--ink)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-md text-[13px] font-medium leading-[1.55] text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function SectionHeading({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-extrabold tracking-[-0.018em] text-[var(--ink)]">
          {title}
        </h2>
        {caption && (
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {caption}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "brand" | "neutral" | "warning" | "danger" | "success";
}) {
  const tones = {
    brand:
      "border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand)]",
    neutral:
      "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]",
    warning:
      "border-[var(--warning-line)] bg-[var(--warning-soft)] text-[var(--warning)]",
    danger:
      "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]",
    success:
      "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]",
  };
  return (
    <span
      className={clsx(
        "inline-flex min-h-6 items-center rounded-[5px] border px-2.5 text-[10px] font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl bg-[var(--skeleton)]",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-3 py-1">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-36 w-full rounded-[18px]" />
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-[18px]" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <Panel className="px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-extrabold tracking-[-0.015em] text-[var(--ink)]">
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm font-medium leading-5 text-[var(--muted)]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </Panel>
  );
}

export function ErrorState({
  title = "Ma'lumot yuklanmadi",
  description,
  retry,
}: {
  title?: string;
  description: string;
  retry?: () => void;
}) {
  return (
    <Panel className="border-[var(--danger-line)] bg-[var(--danger-soft)] px-5 py-6 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-[var(--danger)]" />
      <h3 className="mt-2 text-sm font-extrabold text-[var(--ink)]">{title}</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-[var(--muted)]">
        {description}
      </p>
      {retry && (
        <Button variant="secondary" className="mt-4 min-h-10" onClick={retry}>
          <RotateCcw className="h-4 w-4" />
          Qayta urinish
        </Button>
      )}
    </Panel>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );
      if (!focusable.length) {
        event.preventDefault();
        sheet.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleEscape);

    const focusFrame = window.requestAnimationFrame(() => {
      const sheet = sheetRef.current;
      const initial =
        sheet?.querySelector<HTMLElement>("[data-sheet-initial-focus]") ??
        sheet?.querySelector<HTMLElement>("[data-sheet-close]") ??
        sheet;
      initial?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleEscape);
      if (previousActive?.isConnected) {
        previousActive.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="sheet-backdrop-enter fixed inset-0 z-[90] flex items-end justify-center bg-[#17201b]/28 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="sheet-enter flex max-h-[calc(100dvh-var(--app-safe-top)-8px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[14px] border-x border-t border-[var(--line)] bg-[var(--surface)] outline-none"
      >
        <div className="shrink-0 px-4 pt-2">
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--line-strong)]" />
        </div>
        <header className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-3">
          <div>
            <h2
              id={titleId}
              className="text-lg font-extrabold tracking-[-0.025em] text-[var(--ink)]"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm font-medium leading-5 text-[var(--muted)]"
              >
                {description}
              </p>
            )}
          </div>
          <IconButton
            label="Yopish"
            data-sheet-close
            className="h-10 w-10 rounded-xl"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[var(--line)] px-4 pb-[calc(18px+var(--app-safe-bottom))] pt-4">
          {children}
        </div>
      </section>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-semibold text-[var(--danger)]">
      {message}
    </p>
  );
}

export const inputClass =
  "h-[46px] w-full rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-base font-semibold text-[var(--ink)] outline-none transition placeholder:font-medium placeholder:text-[var(--muted-light)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]";
