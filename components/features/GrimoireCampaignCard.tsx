"use client";

import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireBadge from "@/components/ui/GrimoireBadge";

type Props = {
  nome: string;
  stato: string;
  descrizione: string | null;
  creatore: string;
  unita: string;
};

export default function GrimoireCampaignCard({ nome, stato, descrizione, creatore, unita }: Props) {
  return (
    <GrimoireCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <h5 style={{ margin: 0, color: "var(--g-text)", fontWeight: 600 }}>{nome}</h5>
        <GrimoireBadge>{stato}</GrimoireBadge>
      </div>
      {descrizione && (
        <p style={{ color: "var(--g-text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
          {descrizione}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
        <small style={{ color: "var(--g-text-muted)" }}>{creatore}</small>
        <small style={{ color: "var(--g-text-muted)" }}>{unita}</small>
      </div>
    </GrimoireCard>
  );
}
