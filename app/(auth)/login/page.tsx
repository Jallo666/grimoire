"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { LOGIN } from "@/lib/queries/users";
import GrimoireAuthLayout from "@/components/ui/GrimoireAuthLayout";
import GrimoireForm, { type FieldConfig } from "@/components/ui/GrimoireForm";
import AppLogo from "@/components/ui/AppLogo";
import GrimoireVersion from "@/components/ui/GrimoireVersion";

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
    <GrimoireAuthLayout logo={<AppLogo fullWidth />}>
      <GrimoireForm
        title={t("loginTitle")}
        subtitle={t("loginSubtitle")}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel={t("loginSubmit")}
        loading={loading}
        error={error}
        actions={[{ label: t("loginGoRegister"), onClick: () => router.push("/register") }]}
      />
      <GrimoireVersion />
    </GrimoireAuthLayout>
  );
}
