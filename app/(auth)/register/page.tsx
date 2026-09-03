"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { REGISTER } from "@/lib/queries/users";
import GrimoireForm from "@/components/ui/GrimoireForm";
import AppLogo from "@/components/ui/AppLogo";

const FIELDS = [
  { name: "nome", label: "Nome", type: "text" as const },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "password", label: "Password", type: "password" as const, required: true },
];

export default function RegisterPage() {
  const router = useRouter();

  const [register, { loading, error }] = useMutation(REGISTER, {
    onCompleted: () => router.push("/"),
  });

  async function handleSubmit(values: Record<string, string>) {
    await register({ variables: { email: values.email, password: values.password, nome: values.nome } });
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <AppLogo className="w-100" />
          </div>
          <GrimoireForm
            title="Registrati"
            subtitle="Crea il tuo account Grimoire"
            fields={FIELDS}
            onSubmit={handleSubmit}
            submitLabel="Registrati"
            loading={loading}
            error={error?.message}
            actions={[{ label: "Accedi", onClick: () => router.push("/login") }]}
          />
        </div>
      </div>
    </main>
  );
}
