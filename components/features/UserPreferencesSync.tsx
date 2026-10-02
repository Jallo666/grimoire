"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { useAppDispatch } from "@/store/hooks";
import { ME } from "@/lib/queries/users";
import { applyTheme, THEME_STORAGE_KEY } from "./ThemeSync";

type MeData = { me: { id: string; defaultTheme: string | null; defaultLocale: string | null } | null };

export default function UserPreferencesSync() {
  const dispatch = useAppDispatch();
  const { data } = useQuery<MeData>(ME);
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const me = data?.me;
    if (!me || appliedRef.current === me.id) return;
    appliedRef.current = me.id;

    if (me.defaultTheme === "dark" || me.defaultTheme === "light") {
      localStorage.setItem(THEME_STORAGE_KEY, me.defaultTheme);
      applyTheme(me.defaultTheme === "dark", dispatch);
    }

    if (me.defaultLocale === "it" || me.defaultLocale === "en") {
      const current = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
      if (current !== me.defaultLocale) {
        document.cookie = `NEXT_LOCALE=${me.defaultLocale}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
      }
    }
  }, [data, dispatch]);

  return null;
}
