import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  return {
    locale: "it",
    messages: (await import("../messages/it.json")).default,
  };
});
