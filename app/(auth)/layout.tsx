export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      {children}
    </div>
  );
}
