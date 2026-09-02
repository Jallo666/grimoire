"use client";

import { useState, useEffect } from "react";

type Campaign = {
  id: number;
  nome: string;
  ownerId: number;
};

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCampaigns() {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data);
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    setNome("");
    await fetchCampaigns();
    setLoading(false);
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-8">Campagne</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome campagna"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creazione..." : "Crea campagna"}
        </button>
      </form>

      <ul className="space-y-2">
        {campaigns.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 text-sm"
          >
            <span className="font-medium">{c.nome}</span>
            <span className="text-gray-400">#{c.id}</span>
          </li>
        ))}
        {campaigns.length === 0 && (
          <li className="text-gray-400 text-sm">Nessuna campagna ancora.</li>
        )}
      </ul>
    </main>
  );
}
