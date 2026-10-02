import type { Metadata } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Providers } from "./providers";
import { NextIntlClientProvider } from "next-intl";
import messages from "../messages/it.json";

export const metadata: Metadata = {
  title: "Grimoire",
  description: "Gestione campagne",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it">
      <body>
        <NextIntlClientProvider locale="it" messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
