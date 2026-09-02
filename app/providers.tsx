"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/lib/apollo-client";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import ThemeSync from "@/components/features/ThemeSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeSync />
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </ReduxProvider>
  );
}
