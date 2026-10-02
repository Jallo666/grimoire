"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { SPELL, UPDATE_SPELL, SHARE_SPELL_USER } from "@/lib/queries/spells";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import GrimoireModal from "@/components/ui/GrimoireModal";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import GrimoireInput from "@/components/ui/GrimoireInput";

type SpellDetail = {
  id: string;
  nome: string;
  descrizione: string | null;
  scuola: string | null;
  livello: number;
  tempoLancio: string | null;
  gittata: string | null;
  durata: string | null;
  componenti: string | null;
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

const FIELDS: FieldConfig[] = [
  { name: "nome", label: "Nome", type: "text", required: true },
  { name: "scuola", label: "Scuola", type: "select", options: SCUOLA_OPTIONS },
  { name: "livello", label: "Livello", type: "select", options: LIVELLO_OPTIONS },
  { name: "descrizione", label: "Descrizione", type: "text" },
  { name: "tempoLancio", label: "Tempo di lancio", type: "text" },
  { name: "gittata", label: "Gittata", type: "text" },
  { name: "durata", label: "Durata", type: "text" },
  { name: "componenti", label: "Componenti", type: "text" },
];

export default function SpellDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ spell: SpellDetail }>(SPELL, { variables: { id } });
  const [updateSpell, { loading: updating, error: updateError }] = useMutation(UPDATE_SPELL, { onCompleted: () => refetch() });
  const [shareSpell, { loading: sharing, error: shareError }] = useMutation(SHARE_SPELL_USER, {
    onCompleted: () => { setShareSuccess(true); setShareEmail(""); },
  });

  if (error) throw error;

  if (loading || !data?.spell) {
    return (
      <main className="container py-5">
        <div className="placeholder-glow mb-4">
          <span className="placeholder col-4 rounded" style={{ height: "32px" }} />
        </div>
        <GrimoireForm title="Dettagli incantesimo" fields={FIELDS} onSubmit={() => {}} fetching />
      </main>
    );
  }

  const spell = data.spell;

  const initialValues: Record<string, string> = {
    nome: spell.nome,
    descrizione: spell.descrizione ?? "",
    scuola: spell.scuola ?? "",
    livello: String(spell.livello),
    tempoLancio: spell.tempoLancio ?? "",
    gittata: spell.gittata ?? "",
    durata: spell.durata ?? "",
    componenti: spell.componenti ?? "",
  };

  async function handleUpdate(values: Record<string, string>) {
    await updateSpell({
      variables: {
        id,
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
        <GrimoirePageTitle showBack>{spell.nome}</GrimoirePageTitle>
        <GrimoireButton icon="share" tooltip="Condividi" variant="outline-secondary" onClick={() => { setShowShare(true); setShareSuccess(false); }} />
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <GrimoireForm
            key={spell.id}
            title="Dettagli incantesimo"
            fields={FIELDS}
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel="Salva modifiche"
            loading={updating}
            error={updateError?.message}
            view={!spell.isOwner}
          />
        </div>
      </div>

      <GrimoireModal show={showShare} onClose={() => setShowShare(false)} title="Condividi incantesimo">
        {shareSuccess && <GrimoireAlert variant="success">Incantesimo condiviso!</GrimoireAlert>}
        {shareError && <GrimoireAlert>{shareError.message}</GrimoireAlert>}
        <GrimoireInput
          id="share-email"
          label="Email utente"
          type="email"
          value={shareEmail}
          onChange={(e) => setShareEmail((e.target as HTMLInputElement).value)}
          placeholder="utente@esempio.it"
        />
        <div className="d-flex justify-content-end gap-2 mt-3">
          <GrimoireButton variant="outline-secondary" onClick={() => setShowShare(false)}>Annulla</GrimoireButton>
          <GrimoireButton loading={sharing} onClick={() => shareSpell({ variables: { spellId: id, email: shareEmail } })}>
            Condividi
          </GrimoireButton>
        </div>
      </GrimoireModal>
    </main>
  );
}
