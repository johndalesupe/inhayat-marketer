"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/src/store/store";
import { TelegramProvider } from "@/src/telegram/TelegramProvider";
import { SessionBootstrap } from "./session-bootstrap";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>
          <SessionBootstrap>{children}</SessionBootstrap>
        </TelegramProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

