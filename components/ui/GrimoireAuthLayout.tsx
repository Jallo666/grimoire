import styles from "./GrimoireAuthLayout.module.css";

type Props = { children: React.ReactNode; logo?: React.ReactNode };

export default function GrimoireAuthLayout({ children, logo }: Props) {
  return (
    // Pagina alta almeno quanto lo schermo, con il contenuto centrato in verticale
    <div className="min-vh-100 d-flex align-items-center">
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            {logo && <div className={`text-center mb-4 ${styles.logo}`}>{logo}</div>}
            {/* Contenitore separato: senza, la card (h-100) si allunga quanto tutta la colonna, logo compreso */}
            <div>{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
