type Props = { children: React.ReactNode };

export default function GrimoireCardGrid({ children }: Props) {
  return <div className="row g-4">{children}</div>;
}
