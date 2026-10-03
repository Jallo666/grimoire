import styles from "./GrimoireInlineGroup.module.css";

type Props = {
  children: React.ReactNode;
  // se non c'è spazio, gli elementi vanno a capo
  wrap?: boolean;
  // spazio sotto il gruppo
  spaced?: boolean;
  // il primo elemento prende tutto lo spazio libero (es. campo di testo + bottone)
  fillFirst?: boolean;
};

// Elementi affiancati su una riga (bottoni, filtri, un campo con un bottone…)
export default function GrimoireInlineGroup({ children, wrap = false, spaced = false, fillFirst = false }: Props) {
  const classes = [styles.group, wrap && styles.wrap, spaced && styles.spaced, fillFirst && styles.fillFirst].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}
