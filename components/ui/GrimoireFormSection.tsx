type Props = { children: React.ReactNode };

export default function GrimoireFormSection({ children }: Props) {
  return (
    <div className="row g-4 mb-5">
      <div className="col-12 col-lg-6">
        {children}
      </div>
    </div>
  );
}
