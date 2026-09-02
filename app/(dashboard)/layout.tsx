import GrimoireNavbar from "@/components/features/GrimoireNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GrimoireNavbar />
      {children}
    </>
  );
}
