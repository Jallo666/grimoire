"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { REGISTER } from "@/lib/queries/users";
import GrimoireAuthLayout from "@/components/ui/GrimoireAuthLayout";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import AppLogo from "@/components/ui/AppLogo";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");

  const fields: FieldConfig[] = [
    { name: "nome", label: t("fieldNome"), type: "text" },
    { name: "email", label: t("fieldEmail"), type: "email", required: true },
    { name: "password", label: t("fieldPassword"), type: "password", required: true },
  ];

  const [register, { loading, error }] = useMutation(REGISTER, {
    onCompleted: () => router.push("/"),
  });

  async function handleSubmit(values: Record<string, string>) {
    await register({ variables: { email: values.email, password: values.password, nome: values.nome } });
  }

  return (
    <GrimoireAuthLayout logo={<AppLogo className="w-100" />}>
      <GrimoireForm
        title={t("registerTitle")}
        subtitle={t("registerSubtitle")}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel={t("registerSubmit")}
        loading={loading}
        error={error?.message}
        actions={[{ label: t("registerGoLogin"), onClick: () => router.push("/login") }]}
      />
    </GrimoireAuthLayout>
  );
}
