"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LOGIN } from "@/lib/queries/users";
import GrimoireForm from "@/components/ui/GrimoireForm";
import AppLogo from "@/components/ui/AppLogo";

const FIELDS = [
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "password", label: "Password", type: "password" as const, required: true },
];

export default function LoginPage() {
  const router = useRouter();

  const [login, { loading, error }] = useMutation(LOGIN, {
    onCompleted: () => router.push("/"),
  });

  async function handleSubmit(values: Record<string, string>) {
    await login({ variables: { email: values.email, password: values.password } });
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <AppLogo className="w-100" />
          </div>
          <GrimoireForm
            title="Accedi"
            subtitle="Inserisci le tue credenziali"
            fields={FIELDS}
            onSubmit={handleSubmit}
            submitLabel="Accedi"
            loading={loading}
            error={error?.message}
            actions={[{ label: "Registrati", onClick: () => router.push("/register") }]}
          />
        </div>
      </div>
    </main>
  );
}
