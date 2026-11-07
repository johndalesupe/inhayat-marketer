"use client";

import { useQuery } from "@tanstack/react-query";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL ?? "https://api.inhayat.com/api/v1";
import type {
  ContactCategory,
  ResolvedOperatorContact,
} from "@/src/lib/operator-contacts";

export function useOperatorContact(
  surface: ContactCategory,
  language: "uz" | "ru" = "uz",
) {
  return useQuery({
    queryKey: ["operator-contact", surface, language],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/operator-links/resolve?surface=${surface}&language=${language}`,
        { signal, credentials: "omit" },
      );
      if (!response.ok) throw new Error("Operator kontaktini yuklab bo'lmadi");
      const result = (await response.json()) as {
        data: ResolvedOperatorContact;
      };
      return result.data;
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
