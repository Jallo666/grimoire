"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { CAMPAIGNS_HOME } from "@/lib/queries/campaigns";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireCardGrid from "@/components/ui/GrimoireCardGrid";
import GrimoireCardGridItem from "@/components/ui/GrimoireCardGridItem";
import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireEmptyState from "@/components/ui/GrimoireEmptyState";
import GrimoireCampaignCard from "@/components/features/GrimoireCampaignCard";

type CampaignCard = {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: string;
  unitaMisuraDefault: string;
  owner: { nome: string | null; email: string } | null;
};

export default function HomePage() {
  const t = useTranslations("home");
  const { data, loading } = useQuery<{ campaigns: CampaignCard[] }>(CAMPAIGNS_HOME);
  const campaigns = data?.campaigns ?? [];

  return (
    <GrimoirePage>
      <GrimoirePageTitle action={
        <Link href="/campaigns">
          <GrimoireButton variant="primary">{t("newCampaign")}</GrimoireButton>
        </Link>
      }>
        {t("title")}
      </GrimoirePageTitle>

      {loading && (
        <GrimoireCardGrid>
          {Array.from({ length: 3 }).map((_, i) => (
            <GrimoireCardGridItem key={i}>
              <GrimoireCard skeleton />
            </GrimoireCardGridItem>
          ))}
        </GrimoireCardGrid>
      )}

      {!loading && campaigns.length === 0 && (
        <GrimoireEmptyState message={t("empty")}>
          <Link href="/campaigns">
            <GrimoireButton variant="primary">{t("goToCampaigns")}</GrimoireButton>
          </Link>
        </GrimoireEmptyState>
      )}

      {!loading && campaigns.length > 0 && (
        <GrimoireCardGrid>
          {campaigns.map((c) => (
            <GrimoireCardGridItem key={c.id}>
              <GrimoireCampaignCard
                nome={c.nome}
                stato={c.stato}
                descrizione={c.descrizione}
                creatore={c.owner ? (c.owner.nome ?? c.owner.email) : "—"}
                unita={c.unitaMisuraDefault}
              />
            </GrimoireCardGridItem>
          ))}
        </GrimoireCardGrid>
      )}
    </GrimoirePage>
  );
}
