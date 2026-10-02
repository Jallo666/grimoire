"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/lib/apollo-client";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import ThemeSync from "@/components/features/ThemeSync";
import UserPreferencesSync from "@/components/features/UserPreferencesSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeSync />
      <ApolloProvider client={apolloClient}>
        <UserPreferencesSync />
        {children}
      </ApolloProvider>
    </ReduxProvider>
  );
}
