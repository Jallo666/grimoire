"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "graphql-tag";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireBadge from "@/components/ui/GrimoireBadge";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import type { Campaign } from "@/db/types";

const CAMPAIGNS = gql`
  query Campaigns {
    campaigns {
      id
      nome
      ownerId
    }
  }
`;

const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($nome: String!) {
    createCampaign(nome: $nome) {
      id
      nome
      ownerId
    }
  }
`;

export default function CampaignsPage() {
  const [nome, setNome] = useState("");

  const { data, refetch } = useQuery<{ campaigns: Campaign[] }>(CAMPAIGNS);
  const [createCampaign, { loading: creating }] = useMutation(CREATE_CAMPAIGN, {
    onCompleted: () => refetch(),
  });

  const campaigns: Campaign[] = data?.campaigns ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await createCampaign({ variables: { nome } });
    setNome("");
  }

  return (
    <main className="container py-5">
      <GrimoirePageTitle>Le tue campagne</GrimoirePageTitle>

      <form onSubmit={handleSubmit} className="row g-2 mb-4">
        <div className="col">
          <GrimoireInput
            id="nome-campagna"
            placeholder="Nome campagna"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <GrimoireButton type="submit" loading={creating}>
            {creating ? "Creazione…" : "Crea campagna"}
          </GrimoireButton>
        </div>
      </form>

      {campaigns.length === 0 ? (
        <p className="text-muted">Nessuna campagna ancora.</p>
      ) : (
        <ul className="list-group">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{c.nome}</span>
              <GrimoireBadge>#{c.id}</GrimoireBadge>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
