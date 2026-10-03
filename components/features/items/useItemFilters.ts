"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type ItemTab = "all" | "srd" | "mine";

// Tab e filtri della pagina oggetti, nell'URL (?tab=mine&search=dia&category=gemma,polvere)
export function useItemFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const tab: ItemTab = tabParam === "srd" || tabParam === "mine" ? tabParam : "all";
  const search = searchParams.get("search") ?? "";
  const categories = (searchParams.get("category") ?? "").split(",").filter(Boolean);

  // Cambia un parametro (vuoto = tolto), partendo dall'URL attuale
  function setParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Cambiando tab i filtri si azzerano
  const changeTab = (next: ItemTab) => router.replace(`${pathname}?tab=${next}`);
  const resetFilters = () => router.replace(`${pathname}?tab=${tab}`);
  const activeCount = [search, categories.length].filter(Boolean).length;

  return { tab, search, categories, setParam, changeTab, resetFilters, activeCount };
}
