import { env } from "../../core/env";

export async function fetchDataForSeoDomainSummary(domain: string) {
  const login = env.DATAFORSEO_LOGIN?.trim();
  const password = env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN ve DATAFORSEO_PASSWORD tanimli degil");
  }

  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch("https://api.dataforseo.com/v3/backlinks/domain_summary/live", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        target: domain,
        limit: 100,
      },
    ]),
    signal: AbortSignal.timeout(45_000),
  });

  const data = (await res.json()) as { tasks?: unknown[]; status_message?: string };
  if (!res.ok) {
    throw new Error(data.status_message ?? `DataForSEO HTTP ${res.status}`);
  }
  return data;
}
