import type { Metadata } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Providers } from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Grimoire",
  description: "Gestione campagne",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const messages = await getMessages();
  return (
    <html lang="it">
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
