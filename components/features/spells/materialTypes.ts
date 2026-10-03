// Opzioni e ingredienti del componente materiale, come arrivano dal server
export type MaterialIngredient = { quantita: number; valoreMinimo: number | null; consumato: boolean; item: { id: string; nome: string } };
export type MaterialOption = { valoreTotaleMinimo: number | null; ingredienti: MaterialIngredient[] };
