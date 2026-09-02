import { ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";

const link = new HttpLink({
  uri: "/api/graphql",
  credentials: "include",
});

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
