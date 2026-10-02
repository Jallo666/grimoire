type Props = { children: React.ReactNode; half?: boolean };

export default function GrimoireCardGridItem({ children, half = false }: Props) {
  const col = half ? "col-12 col-md-6" : "col-12 col-md-6 col-lg-4";
  return <div className={col}>{children}</div>;
}
