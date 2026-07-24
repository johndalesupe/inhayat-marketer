"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { apiErrorMessage, marketerApi, setApiAccessToken } from "@/src/lib/api";
import {
  setAuthenticated,
  setPreview,
  setSessionError,
} from "@/src/store/session-slice";
import { useAppDispatch } from "@/src/store/hooks";
import { useTelegram } from "@/src/telegram/TelegramProvider";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const telegram = useTelegram();
  const attemptedRef = useRef(false);
  const previewDispatchedRef = useRef(false);
  const auth = useMutation({
    mutationFn: ({
      initData,
      startParam,
    }: {
      initData: string;
      startParam: string;
    }) => marketerApi.authenticate(initData, startParam),
    onSuccess: (session) => {
      setApiAccessToken(session.accessToken);
      dispatch(
        setAuthenticated({
          accessToken: session.accessToken,
          profile: session.marketer,
        }),
      );
    },
    onError: (error) => {
      setApiAccessToken(null);
      dispatch(
        setSessionError(
          apiErrorMessage(error, "Telegram orqali kirish bajarilmadi"),
        ),
      );
    },
  });

  useEffect(() => {
    if (!telegram.ready) return;

    if (!telegram.isTelegram) {
      if (!previewDispatchedRef.current) {
        previewDispatchedRef.current = true;
        dispatch(setPreview());
      }
      return;
    }
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    if (!telegram.initData) {
      dispatch(
        setSessionError(
          "Telegram sessiyasi topilmadi. Ilovani marketer botidagi tugma orqali oching.",
        ),
      );
      return;
    }

    auth.mutate({
      initData: telegram.initData,
      startParam: telegram.startParam,
    });
  }, [
    auth,
    dispatch,
    telegram.initData,
    telegram.isTelegram,
    telegram.ready,
    telegram.startParam,
  ]);

  return children;
}
