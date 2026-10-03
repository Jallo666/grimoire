type Props = { children: React.ReactNode };

// Mette gli elementi uno sotto l'altro con uno spazio regolare tra loro (16px)
export default function GrimoireStack({ children }: Props) {
  return <div className="d-flex flex-column gap-3">{children}</div>;
}
