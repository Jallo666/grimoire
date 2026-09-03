"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { CAMPAIGNS_HOME } from "@/lib/queries/campaigns";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoireButton from "@/components/ui/GrimoireButton";

type CampaignCard = {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: string;
  unitaMisuraDefault: string;
  owner: { nome: string | null; email: string } | null;
};

export default function HomePage() {
  const { data, loading } = useQuery<{ campaigns: CampaignCard[] }>(CAMPAIGNS_HOME);
  const campaigns = data?.campaigns ?? [];

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <GrimoirePageTitle>Le tue campagne</GrimoirePageTitle>
        <Link href="/campaigns">
          <GrimoireButton variant="primary">+ Nuova campagna</GrimoireButton>
        </Link>
      </div>

      {loading && (
        <div className="row g-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <GrimoireCard bare>
                <div className="card-body p-4">
                  <div className="placeholder-glow">
                    <span className="placeholder col-7 rounded mb-3 d-block" style={{ height: "24px" }} />
                    <span className="placeholder col-10 rounded mb-2 d-block" style={{ height: "14px" }} />
                    <span className="placeholder col-5 rounded" style={{ height: "14px" }} />
                  </div>
                </div>
              </GrimoireCard>
            </div>
          ))}
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted mb-3">Nessuna campagna ancora. Creane una!</p>
          <Link href="/campaigns">
            <GrimoireButton variant="primary">Vai alle campagne</GrimoireButton>
          </Link>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="row g-4">
          {campaigns.map((c) => (
            <div key={c.id} className="col-12 col-md-6 col-lg-4">
              <GrimoireCard>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0" style={{ color: "var(--g-text)" }}>{c.nome}</h5>
                  <GrimoireBadge>{c.stato}</GrimoireBadge>
                </div>
                {c.descrizione && (
                  <p className="small mb-2" style={{ color: "var(--g-text-muted)" }}>
                    {c.descrizione}
                  </p>
                )}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small style={{ color: "var(--g-text-muted)" }}>
                    {c.owner ? (c.owner.nome ?? c.owner.email) : "—"}
                  </small>
                  <small style={{ color: "var(--g-text-muted)" }}>{c.unitaMisuraDefault}</small>
                </div>
              </GrimoireCard>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
