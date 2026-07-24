import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { clsx } from "clsx";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(max-width: 540px) 50vw, 250px",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-[var(--surface-muted)]",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[var(--muted-light)]">
          <ImageIcon className="h-7 w-7" aria-hidden />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}

