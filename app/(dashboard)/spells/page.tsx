"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { MY_SPELLS, CREATE_SPELL, DELETE_SPELL } from "@/lib/queries/spells";
import Link from "next/link";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireTable, { type Column } from "@/components/ui/GrimoireTable";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";

type SpellRow = {
  id: string;
  nome: string;
  scuola: string | null;
  livello: number;
  descrizione: string | null;
  isOwner: boolean;
};

const SCUOLA_OPTIONS = [
  { value: "", label: "—" },
  { value: "Abiurazione", label: "Abiurazione" },
  { value: "Ammaliamento", label: "Ammaliamento" },
  { value: "Divinazione", label: "Divinazione" },
  { value: "Evocazione", label: "Evocazione" },
  { value: "Illusione", label: "Illusione" },
  { value: "Invocazione", label: "Invocazione" },
  { value: "Necromanzia", label: "Necromanzia" },
  { value: "Trasmutazione", label: "Trasmutazione" },
];

const LIVELLO_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "Trucchetto (0)" : `Livello ${i}`,
}));

const CREATE_FIELDS: FieldConfig[] = [
  { name: "nome", label: "Nome", type: "text", required: true },
  { name: "scuola", label: "Scuola", type: "select", options: SCUOLA_OPTIONS },
  { name: "livello", label: "Livello", type: "select", defaultValue: "1", options: LIVELLO_OPTIONS },
  { name: "descrizione", label: "Descrizione", type: "text" },
  { name: "tempoLancio", label: "Tempo di lancio", type: "text" },
  { name: "gittata", label: "Gittata", type: "text" },
  { name: "durata", label: "Durata", type: "text" },
  { name: "componenti", label: "Componenti", type: "text" },
];

const COLUMNS: Column<SpellRow>[] = [
  { key: "nome", label: "Nome" },
  {
    key: "scuola",
    label: "Scuola",
    type: "badge",
    badgeColors: {
      Abiurazione: "primary", Ammaliamento: "warning", Divinazione: "success",
      Evocazione: "danger", Illusione: "secondary", Invocazione: "primary",
      Necromanzia: "danger", Trasmutazione: "success",
    },
  },
  { key: "livello", label: "Livello", render: (v) => v === 0 ? "Trucchetto" : `Liv. ${v}` },
];

export default function SpellsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, refetch } = useQuery<{ mySpells: SpellRow[] }>(MY_SPELLS);
  const spells = data?.mySpells ?? [];

  const [createSpell, { loading: creating, error: createError }] = useMutation(CREATE_SPELL, {
    onCompleted: () => { refetch(); setShowCreate(false); },
  });
  const [deleteSpell] = useMutation(DELETE_SPELL, { onCompleted: () => refetch() });

  async function handleCreate(values: Record<string, string>) {
    await createSpell({
      variables: {
        nome: values.nome,
        descrizione: values.descrizione || null,
        scuola: values.scuola || null,
        livello: Number(values.livello),
        tempoLancio: values.tempoLancio || null,
        gittata: values.gittata || null,
        durata: values.durata || null,
        componenti: values.componenti || null,
      },
    });
  }

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <GrimoirePageTitle>I miei incantesimi</GrimoirePageTitle>
        <GrimoireButton onClick={() => setShowCreate(true)}>+ Nuovo incantesimo</GrimoireButton>
      </div>

      <GrimoireTable
        columns={COLUMNS}
        data={spells}
        emptyMessage="Nessun incantesimo ancora. Creane uno!"
        actions={(s) => [
          { icon: "eye", tooltip: "Dettaglio", variant: "outline-secondary", href: `/spells/${s.id}` },
          { icon: "trash", tooltip: "Elimina", variant: "danger", onClick: () => deleteSpell({ variables: { id: s.id } }), hidden: !s.isOwner },
        ]}
      />

      <GrimoireModal show={showCreate} onClose={() => setShowCreate(false)} title="Nuovo incantesimo" size="lg">
        <GrimoireForm
          fields={CREATE_FIELDS}
          onSubmit={handleCreate}
          submitLabel="Crea incantesimo"
          loading={creating}
          error={createError?.message}
          actions={[{ label: "Annulla", onClick: () => setShowCreate(false) }]}
        />
      </GrimoireModal>
    </main>
  );
}
