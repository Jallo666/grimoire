type Props = { children: React.ReactNode; full?: boolean };

export default function GrimoireFormSection({ children, full = false }: Props) {
  return (
    <div className="row g-4 mb-5">
      <div className={full ? "col-12" : "col-12 col-lg-6"}>
        {children}
      </div>
    </div>
  );
}
