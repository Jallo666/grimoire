"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useAppDispatch } from "@/store/hooks";
import { ME, UPDATE_EMAIL, UPDATE_PASSWORD, UPDATE_PREFERENCES } from "@/lib/queries/users";
import { applyTheme, THEME_STORAGE_KEY } from "@/components/features/ThemeSync";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireCardGrid from "@/components/ui/GrimoireCardGrid";
import GrimoireCardGridItem from "@/components/ui/GrimoireCardGridItem";
import GrimoireFormSection from "@/components/ui/GrimoireFormSection";
import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";

type MeData = {
  me: { id: string; email: string; nome: string | null; defaultTheme: string | null; defaultLocale: string | null } | null;
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();

  const { data, refetch } = useQuery<MeData>(ME);
  const me = data?.me;

  // Email section
  const [emailNew, setEmailNew] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password section
  const [passOld, setPassOld] = useState("");
  const [passNew, setPassNew] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Preferences section
  const [prefTheme, setPrefTheme] = useState("");
  const [prefLocale, setPrefLocale] = useState("");
  const [prefsMsg, setPrefsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (me) {
      setPrefTheme(me.defaultTheme ?? "");
      setPrefLocale(me.defaultLocale ?? "");
    }
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [updateEmail, { loading: updatingEmail }] = useMutation(UPDATE_EMAIL, {
    onCompleted: () => {
      setEmailMsg({ ok: true, text: t("emailSuccess") });
      setEmailNew("");
      setEmailPass("");
      refetch();
    },
    onError: (e) => setEmailMsg({ ok: false, text: e.message }),
  });

  const [updatePassword, { loading: updatingPassword }] = useMutation(UPDATE_PASSWORD, {
    onCompleted: () => {
      setPassMsg({ ok: true, text: t("passwordSuccess") });
      setPassOld("");
      setPassNew("");
      setPassConfirm("");
    },
    onError: (e) => setPassMsg({ ok: false, text: e.message }),
  });

  const [updatePreferences, { loading: updatingPrefs }] = useMutation(UPDATE_PREFERENCES, {
    onCompleted: (result) => {
      setPrefsMsg({ ok: true, text: t("prefsSuccess") });
      refetch();
      const saved = result.updatePreferences;

      if (saved.defaultTheme === "dark" || saved.defaultTheme === "light") {
        localStorage.setItem(THEME_STORAGE_KEY, saved.defaultTheme);
        applyTheme(saved.defaultTheme === "dark", dispatch);
      } else {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }

      if (saved.defaultLocale === "it" || saved.defaultLocale === "en") {
        const current = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
        if (current !== saved.defaultLocale) {
          document.cookie = `NEXT_LOCALE=${saved.defaultLocale}; path=/; max-age=31536000; SameSite=Lax`;
          window.location.reload();
        }
      }
    },
    onError: (e) => setPrefsMsg({ ok: false, text: e.message }),
  });

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    updateEmail({ variables: { newEmail: emailNew, password: emailPass } });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg(null);
    if (passNew !== passConfirm) {
      setPassMsg({ ok: false, text: t("passwordMismatch") });
      return;
    }
    updatePassword({ variables: { currentPassword: passOld, newPassword: passNew } });
  }

  function handlePrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPrefsMsg(null);
    updatePreferences({
      variables: { defaultTheme: prefTheme || null, defaultLocale: prefLocale || null },
    });
  }

  return (
    <GrimoirePage>
      <GrimoirePageTitle>{t("pageTitle")}</GrimoirePageTitle>

      <GrimoireCardGrid mb>
        <GrimoireCardGridItem half>
          <GrimoireCard title={t("emailSection")}>
            {me && (
              <p style={{ color: "var(--g-text-muted)", marginBottom: "1rem", fontSize: "0.875rem" }}>
                {t("emailCurrent")}: <strong style={{ color: "var(--g-text)" }}>{me.email}</strong>
              </p>
            )}
            {emailMsg && (
              <GrimoireAlert variant={emailMsg.ok ? "success" : "danger"}>{emailMsg.text}</GrimoireAlert>
            )}
            <form onSubmit={handleEmailSubmit}>
              <GrimoireInput
                id="email-new"
                label={t("emailNew")}
                type="email"
                value={emailNew}
                onChange={(e) => setEmailNew(e.target.value)}
                required
              />
              <GrimoireInput
                id="email-pass"
                label={t("emailPassword")}
                type="password"
                value={emailPass}
                onChange={(e) => setEmailPass(e.target.value)}
                required
              />
              <GrimoireButton type="submit" loading={updatingEmail}>{t("emailSave")}</GrimoireButton>
            </form>
          </GrimoireCard>
        </GrimoireCardGridItem>

        <GrimoireCardGridItem half>
          <GrimoireCard title={t("passwordSection")}>
            {passMsg && (
              <GrimoireAlert variant={passMsg.ok ? "success" : "danger"}>{passMsg.text}</GrimoireAlert>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <GrimoireInput
                id="pass-old"
                label={t("passwordCurrent")}
                type="password"
                value={passOld}
                onChange={(e) => setPassOld(e.target.value)}
                required
              />
              <GrimoireInput
                id="pass-new"
                label={t("passwordNew")}
                type="password"
                value={passNew}
                onChange={(e) => setPassNew(e.target.value)}
                required
              />
              <GrimoireInput
                id="pass-confirm"
                label={t("passwordConfirm")}
                type="password"
                value={passConfirm}
                onChange={(e) => setPassConfirm(e.target.value)}
                required
              />
              <GrimoireButton type="submit" loading={updatingPassword}>{t("passwordSave")}</GrimoireButton>
            </form>
          </GrimoireCard>
        </GrimoireCardGridItem>
      </GrimoireCardGrid>

      <GrimoireFormSection>
        <GrimoireCard title={t("prefsSection")}>
          {prefsMsg && (
            <GrimoireAlert variant={prefsMsg.ok ? "success" : "danger"}>{prefsMsg.text}</GrimoireAlert>
          )}
          <form onSubmit={handlePrefsSubmit}>
            <GrimoireInput
              id="pref-theme"
              label={t("prefsTheme")}
              type="select"
              value={prefTheme}
              onChange={(e) => setPrefTheme(e.target.value)}
              options={[
                { value: "", label: t("prefsThemeSystem") },
                { value: "light", label: t("prefsThemeLight") },
                { value: "dark", label: t("prefsThemeDark") },
              ]}
            />
            <GrimoireInput
              id="pref-locale"
              label={t("prefsLocale")}
              type="select"
              value={prefLocale}
              onChange={(e) => setPrefLocale(e.target.value)}
              options={[
                { value: "", label: t("prefsLocaleSystem") },
                { value: "it", label: t("prefsLocaleit") },
                { value: "en", label: t("prefsLocaleen") },
              ]}
            />
            <GrimoireButton type="submit" loading={updatingPrefs}>{t("prefsSave")}</GrimoireButton>
          </form>
        </GrimoireCard>
      </GrimoireFormSection>
    </GrimoirePage>
  );
}
