interface XPostResult {
  id: string;
}

type XTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export function buildXAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}) {
  const scope = params.scope || "tweet.read tweet.write users.read offline.access";
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${q.toString()}`;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });
  const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.error_description ?? data.error ?? "X token exchange failed"));
  }
  return data as unknown as XTokenResponse;
}

export async function publishTextPost(bearerToken: string, text: string): Promise<XPostResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(data?.detail ?? data?.title ?? "X publish failed");
  }
  return { id: String(data?.data?.id ?? "unknown") };
}

export async function getAccountInfo(bearerToken: string, userId: string) {
  const res = await fetch(`https://api.twitter.com/2/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any)?.detail ?? "X info failed");
  return data;
}

export async function getOAuth2Me(bearerToken: string): Promise<{ id: string; username: string; name?: string }> {
  const res = await fetch("https://api.twitter.com/2/users/me?user.fields=username,name", {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  const data = (await res.json()) as {
    data?: { id?: string; username?: string; name?: string };
    detail?: string;
    title?: string;
  };
  if (!res.ok) {
    throw new Error(String(data.detail ?? data.title ?? "X users/me failed"));
  }
  const id = data.data?.id;
  const username = data.data?.username ?? "";
  if (!id) throw new Error("X user id alinamadi");
  return { id, username, name: data.data?.name };
}
