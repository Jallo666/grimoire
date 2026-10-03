import { redirect } from "next/navigation";

// La modifica di un incantesimo ora è una modale nella lista (la stessa della creazione):
// i vecchi link a /spells/<id> riportano alla lista
export default function SpellEditRedirect() {
  redirect("/spells");
}
