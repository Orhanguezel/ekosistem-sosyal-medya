import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getServiceAccountCredentialsForAnalyticsData } from "./google-sa";

function normalizePropertyResource(propertyId: string): string {
  const t = propertyId.trim();
  if (t.startsWith("properties/")) return t;
  return `properties/${t.replace(/^properties\//, "")}`;
}

export async function fetchGa4Summary(propertyId: string) {
  const creds = getServiceAccountCredentialsForAnalyticsData();
  if (!creds) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON tanimli degil");
  }

  const client = new BetaAnalyticsDataClient({
    credentials: creds,
  });

  const property = normalizePropertyResource(propertyId);

  const [daily] = await client.runReport({
    property,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
    ],
    limit: 40,
  });

  const [totals] = await client.runReport({
    property,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "eventCount" },
    ],
  });

  const [topPages] = await client.runReport({
    property,
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePathPlusQueryString" }],
    metrics: [{ name: "screenPageViews" }],
    limit: 15,
  });

  return {
    property,
    dailyRows: daily.rows ?? [],
    totalRows: totals.rows ?? [],
    topPages: topPages.rows ?? [],
  };
}
