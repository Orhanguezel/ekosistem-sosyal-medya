import { google } from "googleapis";
import { env } from "../../core/env";

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

export function parseServiceAccountJson(): { client_email: string; private_key: string } | null {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { client_email: string; private_key: string };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON gecerli JSON degil");
  }
}

export function createMarketingJwt() {
  const credentials = parseServiceAccountJson();
  if (!credentials) return null;
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}

export function getServiceAccountCredentialsForAnalyticsData() {
  const c = parseServiceAccountJson();
  if (!c) return null;
  return {
    client_email: c.client_email,
    private_key: c.private_key,
  };
}
