import { google } from "googleapis";
import { createMarketingJwt } from "./google-sa";

export async function fetchGscSearchAnalytics(siteUrl: string) {
  const auth = createMarketingJwt();
  if (!auth) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON tanimli degil");
  }

  const webmasters = google.webmasters({ version: "v3", auth });
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 28);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const [queries, pages] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["query"],
        rowLimit: 25,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["page"],
        rowLimit: 15,
      },
    }),
  ]);

  return {
    dateRange: { start: startStr, end: endStr },
    topQueries: queries.data.rows ?? [],
    topPages: pages.data.rows ?? [],
  };
}
