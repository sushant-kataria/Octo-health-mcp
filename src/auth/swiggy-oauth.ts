import * as crypto from "crypto";

const SWIGGY_AUTH_URL = "https://api.swiggy.com/oauth2/authorize";
const SWIGGY_TOKEN_URL = "https://api.swiggy.com/oauth2/token";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export function buildAuthorizationURL(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SWIGGY_CLIENT_ID ?? "",
    redirect_uri: process.env.REDIRECT_URI ?? "",
    response_type: "code",
    scope: "orders:read profile:read",
    state,
  });
  return `${SWIGGY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI ?? "",
    client_id: process.env.SWIGGY_CLIENT_ID ?? "",
    client_secret: process.env.SWIGGY_CLIENT_SECRET ?? "",
  });

  const res = await fetch(SWIGGY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<TokenSet>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SWIGGY_CLIENT_ID ?? "",
    client_secret: process.env.SWIGGY_CLIENT_SECRET ?? "",
  });

  const res = await fetch(SWIGGY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<TokenSet>;
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}
