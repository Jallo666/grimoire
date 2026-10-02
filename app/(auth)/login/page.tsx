"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { LOGIN } from "@/lib/queries/users";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import AppLogo from "@/components/ui/AppLogo";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");

  const fields: FieldConfig[] = [
    { name: "email", label: t("fieldEmail"), type: "email", required: true },
    { name: "password", label: t("fieldPassword"), type: "password", required: true },
  ];

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
            title={t("loginTitle")}
            subtitle={t("loginSubtitle")}
            fields={fields}
            onSubmit={handleSubmit}
            submitLabel={t("loginSubmit")}
            loading={loading}
            error={error?.message}
            actions={[{ label: t("loginGoRegister"), onClick: () => router.push("/register") }]}
          />
        </div>
      </div>
    </main>
  );
}
