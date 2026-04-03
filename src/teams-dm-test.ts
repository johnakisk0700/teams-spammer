import { getAccessToken } from "./teams/auth.ts";
import { sendDirectMessage } from "./teams/client.ts";
import { env } from "./config/env.ts";

const token = await getAccessToken(env.TEAMS_TENANT_ID, env.TEAMS_CLIENT_ID);

await sendDirectMessage(
  token,
  "ext_nchatzatoglou@ringana.com",
  "psolotest 123",
);

console.log("Message sent!");
