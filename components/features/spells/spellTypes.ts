// Tipi condivisi dai pezzi della pagina incantesimi

export type SpellGroup = { id: string; nome: string };

// Una riga della lista incantesimi (tabella o card), come arriva dal server
export type SpellRow = {
  id: string;
  nome: string;
  scuola: string | null;
  livello: number;
  gittata: string | null;
  isOwner: boolean;
  isSystem: boolean;
  inLibrary: boolean;
  concentration: boolean | null;
  ritual: boolean | null;
  classi: { id: string; nome: string }[];
  tipiDanno: { id: string; nome: string }[];
  groupId: string | null;
  groupNome: string | null;
};

// Le tre tab della pagina: i miei incantesimi, il compendio SRD, tutti
export type SpellTab = "miei" | "srd" | "tutti";

export type Option = { value: string; label: string };
