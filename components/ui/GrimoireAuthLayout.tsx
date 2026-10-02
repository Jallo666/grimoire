type Props = { children: React.ReactNode; logo?: React.ReactNode };

export default function GrimoireAuthLayout({ children, logo }: Props) {
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          {logo && <div className="text-center mb-4">{logo}</div>}
          {children}
        </div>
      </div>
    </main>
  );
}
