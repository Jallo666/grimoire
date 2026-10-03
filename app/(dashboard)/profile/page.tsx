"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useAppDispatch } from "@/store/hooks";
import { ME, UPDATE_EMAIL, UPDATE_PASSWORD, UPDATE_PREFERENCES } from "@/lib/queries/users";
import { applyTheme, THEME_STORAGE_KEY } from "@/components/features/ThemeSync";
import GrimoirePage from "@/components/ui/GrimoirePage";
import GrimoirePageTitle from "@/components/ui/GrimoirePageTitle";
import GrimoireCardGrid from "@/components/ui/GrimoireCardGrid";
import GrimoireCardGridItem from "@/components/ui/GrimoireCardGridItem";
import GrimoireCard from "@/components/ui/GrimoireCard";
import GrimoireInput from "@/components/ui/GrimoireInput";
import GrimoireButton from "@/components/ui/GrimoireButton";
import GrimoireAlert from "@/components/ui/GrimoireAlert";
import { getLocaleCookie, setLocaleCookie } from "@/lib/localeCookie";

type UserPrefs = {
  id: string;
  email: string;
  nome: string | null;
  defaultTheme: string | null;
  defaultLocale: string | null;
  defaultUnitSystem: string | null;
  defaultCampaignLocale: string | null;
};

type MeData = { me: UserPrefs | null };
type UpdatePrefsResult = { updatePreferences: UserPrefs };

export default function ProfilePage() {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();

  const { data, refetch } = useQuery<MeData>(ME);
  const me = data?.me;

  const [emailNew, setEmailNew] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [passOld, setPassOld] = useState("");
  const [passNew, setPassNew] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [prefTheme, setPrefTheme] = useState("");
  const [prefLocale, setPrefLocale] = useState("");
  const [prefsMsg, setPrefsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [prefUnitSystem, setPrefUnitSystem] = useState("");
  const [prefCampaignLocale, setPrefCampaignLocale] = useState("");
  const [campaignPrefsMsg, setCampaignPrefsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Quando arrivano i dati dell'utente, riempie le preferenze (una volta per utente)
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  if (me && me.id !== loadedUserId) {
    setLoadedUserId(me.id);
    setPrefTheme(me.defaultTheme ?? "");
    setPrefLocale(me.defaultLocale ?? "");
    setPrefUnitSystem(me.defaultUnitSystem ?? "");
    setPrefCampaignLocale(me.defaultCampaignLocale ?? "");
  }

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

  const [updatePreferences, { loading: updatingPrefs }] = useMutation<UpdatePrefsResult>(UPDATE_PREFERENCES, {
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
        const current = getLocaleCookie();
        if (current !== saved.defaultLocale) {
          setLocaleCookie(saved.defaultLocale);
          window.location.reload();
        }
      }
    },
    onError: (e) => setPrefsMsg({ ok: false, text: e.message }),
  });

  const [updateCampaignPrefs, { loading: updatingCampaignPrefs }] = useMutation<UpdatePrefsResult>(UPDATE_PREFERENCES, {
    onCompleted: () => {
      setCampaignPrefsMsg({ ok: true, text: t("prefsSuccess") });
      refetch();
    },
    onError: (e) => setCampaignPrefsMsg({ ok: false, text: e.message }),
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
    updatePreferences({ variables: { defaultTheme: prefTheme || null, defaultLocale: prefLocale || null } });
  }

  function handleCampaignPrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCampaignPrefsMsg(null);
    updateCampaignPrefs({ variables: { defaultUnitSystem: prefUnitSystem || null, defaultCampaignLocale: prefCampaignLocale || null } });
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
              <GrimoireInput id="email-new" label={t("emailNew")} type="email" value={emailNew} onChange={(e) => setEmailNew(e.target.value)} required />
              <GrimoireInput id="email-pass" label={t("emailPassword")} type="password" value={emailPass} onChange={(e) => setEmailPass(e.target.value)} required />
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
              <GrimoireInput id="pass-old" label={t("passwordCurrent")} type="password" value={passOld} onChange={(e) => setPassOld(e.target.value)} required />
              <GrimoireInput id="pass-new" label={t("passwordNew")} type="password" value={passNew} onChange={(e) => setPassNew(e.target.value)} required />
              <GrimoireInput id="pass-confirm" label={t("passwordConfirm")} type="password" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} required />
              <GrimoireButton type="submit" loading={updatingPassword}>{t("passwordSave")}</GrimoireButton>
            </form>
          </GrimoireCard>
        </GrimoireCardGridItem>
      </GrimoireCardGrid>

      <GrimoireCardGrid>
        <GrimoireCardGridItem half>
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
        </GrimoireCardGridItem>

        <GrimoireCardGridItem half>
          <GrimoireCard title={t("campaignPrefsSection")}>
            {campaignPrefsMsg && (
              <GrimoireAlert variant={campaignPrefsMsg.ok ? "success" : "danger"}>{campaignPrefsMsg.text}</GrimoireAlert>
            )}
            <form onSubmit={handleCampaignPrefsSubmit}>
              <GrimoireInput
                id="pref-unit"
                label={t("prefUnitSystem")}
                type="select"
                value={prefUnitSystem}
                onChange={(e) => setPrefUnitSystem(e.target.value)}
                options={[
                  { value: "", label: t("prefUnitNone") },
                  { value: "metri", label: t("prefUnitMetri") },
                  { value: "piedi", label: t("prefUnitPiedi") },
                  { value: "quadretti", label: t("prefUnitQuadretti") },
                ]}
              />
              <GrimoireInput
                id="pref-campaign-locale"
                label={t("prefCampaignLocale")}
                type="select"
                value={prefCampaignLocale}
                onChange={(e) => setPrefCampaignLocale(e.target.value)}
                options={[
                  { value: "", label: t("prefCampaignLocaleNone") },
                  { value: "it", label: t("prefCampaignLocaleit") },
                  { value: "en", label: t("prefCampaignLocaleen") },
                ]}
              />
              <GrimoireButton type="submit" loading={updatingCampaignPrefs}>{t("prefsSave")}</GrimoireButton>
            </form>
          </GrimoireCard>
        </GrimoireCardGridItem>
      </GrimoireCardGrid>
    </GrimoirePage>
  );
}
