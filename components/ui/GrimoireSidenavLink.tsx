import Link from "next/link";

type Props = {
  href: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

// Voce del menu laterale. La voce della pagina attuale è in grassetto con uno sfondo leggero.
export default function GrimoireSidenavLink({ href, active = false, onClick, children }: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-white text-decoration-none rounded px-3 py-2"
      style={{
        fontWeight: active ? 700 : 400,
        opacity: active ? 1 : 0.75,
        backgroundColor: active ? "rgba(255, 255, 255, 0.15)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
