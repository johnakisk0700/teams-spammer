import { getAccessToken } from "./teams/auth.ts";
import {
  getMe,
  listMyTeams,
  listChannels,
  listTeamMembers,
  sendChannelMessage,
  sendDirectMessage,
} from "./teams/client.ts";
import { env } from "./config/env.ts";

const token = await getAccessToken(env.TEAMS_TENANT_ID, env.TEAMS_CLIENT_ID);

const me = await getMe(token);
console.log(`Logged in as: ${me.displayName} (${me.mail})\n`);

const teams = await listMyTeams(token);
console.log("Your teams:");
for (const [i, team] of teams.entries()) {
  console.log(`  [${i}] ${team.displayName} (${team.id})`);
}

// Pick the first team to explore (or change the index)
if (teams.length === 0) {
  console.log("No teams found.");
  process.exit(0);
}

const teamIndex = 0;
const team = teams[teamIndex];
console.log(`\nExploring team: ${team.displayName}\n`);

const channels = await listChannels(token, team.id);
console.log("Channels:");
for (const [i, ch] of channels.entries()) {
  console.log(`  [${i}] ${ch.displayName} (${ch.id})`);
}

try {
  const members = await listTeamMembers(token, team.id);
  console.log("\nMembers:");
  for (const [i, m] of members.entries()) {
    console.log(`  [${i}] ${m.displayName} (${m.mail ?? m.userPrincipalName ?? m.id})`);
  }
} catch {
  console.log("\nMembers: (no permission to list — need TeamMember.Read.All)");
}
