import { join } from "path";

const TOKEN_PATH = join(import.meta.dir, "../../.teams-token.json");

const SCOPES = "Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send Chat.ReadWrite User.Read User.ReadBasic.All";

function msUrl(tenantId: string, path: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/${path}`;
}

async function postForm(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json: any = await res.json();
  if (!res.ok && json.error !== "authorization_pending" && json.error !== "slow_down") {
    throw new Error(`Auth failed: ${json.error_description ?? json.error ?? res.status}`);
  }
  return { ok: res.ok, json };
}

async function loadCache(): Promise<{ access_token: string; refresh_token?: string; expires_at: number } | null> {
  try {
    const cached = JSON.parse(await Bun.file(TOKEN_PATH).text());
    return cached;
  } catch {
    return null;
  }
}

async function saveToken(token: any): Promise<string> {
  await Bun.write(TOKEN_PATH, JSON.stringify({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
  }, null, 2));
  return token.access_token;
}

async function deviceCodeLogin(tenantId: string, clientId: string): Promise<string> {
  const { json: dc } = await postForm(msUrl(tenantId, "devicecode"), {
    client_id: clientId,
    scope: SCOPES,
  });

  console.log("\n" + dc.message + "\n");

  const interval = (dc.interval || 5) * 1000;
  const deadline = Date.now() + dc.expires_in * 1000;

  while (Date.now() < deadline) {
    await Bun.sleep(interval);
    const { ok, json } = await postForm(msUrl(tenantId, "token"), {
      client_id: clientId,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: dc.device_code,
    });
    if (ok) {
      console.log("Authenticated!\n");
      return saveToken(json);
    }
    if (json.error === "slow_down") await Bun.sleep(5000);
  }

  throw new Error("Login timed out — you didn't sign in in time");
}

export async function getAccessToken(tenantId: string, clientId: string): Promise<string> {
  const cached = await loadCache();

  // Still valid
  if (cached && cached.expires_at > Date.now() + 60_000) {
    return cached.access_token;
  }

  // Try refresh
  if (cached?.refresh_token) {
    const { ok, json } = await postForm(msUrl(tenantId, "token"), {
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: cached.refresh_token,
      scope: SCOPES,
    });
    if (ok) return saveToken(json);
  }

  // Full login
  return deviceCodeLogin(tenantId, clientId);
}
