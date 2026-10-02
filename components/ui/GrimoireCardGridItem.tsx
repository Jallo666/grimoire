type Props = { children: React.ReactNode };

export default function GrimoireCardGridItem({ children }: Props) {
  return <div className="col-12 col-md-6 col-lg-4">{children}</div>;
}
