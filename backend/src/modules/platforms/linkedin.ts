interface LinkedInPostResult {
  id: string;
}

type LinkedInTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
};

export function buildLinkedInAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}) {
  const scope = params.scope || "openid profile email w_member_social";
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    scope,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${q.toString()}`;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<LinkedInTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.error_description ?? data.error ?? "LinkedIn token exchange failed"));
  }
  return data as unknown as LinkedInTokenResponse;
}

export async function publishTextPost(
  accessToken: string,
  authorUrn: string,
  text: string
): Promise<LinkedInPostResult> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.message ?? data.error_description ?? "LinkedIn publish failed"));
  }

  return { id: String(data.id ?? data["x-restli-id"] ?? "unknown") };
}

export async function getAccountInfo(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(String((data as any).message ?? "LinkedIn info failed"));
  return data;
}

export async function getLinkedInUserIdentity(accessToken: string): Promise<{ urn: string; name: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { sub?: string; name?: string };
  if (!res.ok) {
    throw new Error(String((data as { message?: string }).message ?? "LinkedIn userinfo failed"));
  }
  const sub = (data.sub ?? "").trim();
  if (!sub) throw new Error("LinkedIn userinfo sub eksik");
  const urn = sub.startsWith("urn:") ? sub : `urn:li:person:${sub}`;
  return { urn, name: data.name ?? "LinkedIn" };
}
