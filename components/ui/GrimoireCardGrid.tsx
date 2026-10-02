type Props = { children: React.ReactNode; mb?: boolean };

export default function GrimoireCardGrid({ children, mb = false }: Props) {
  return <div className={`row g-4${mb ? " mb-4" : ""}`}>{children}</div>;
}
