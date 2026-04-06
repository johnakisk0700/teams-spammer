import { getAccessToken } from './microsoft-teams/auth.ts';
import {
  getMe,
  listMyTeams,
  listChannels,
  listTeamMembers,
  listMyChats,
  listChatMembers,
} from './microsoft-teams/client.ts';
import { env } from './config/env.ts';

const token = await getAccessToken(env.TEAMS_TENANT_ID, env.TEAMS_CLIENT_ID);

const me = await getMe(token);
console.log(`Logged in as: ${me.displayName} (${me.mail})\n`);

const teams = await listMyTeams(token);
console.log('Your teams:');
for (const [i, team] of teams.entries()) {
  console.log(`  [${i}] ${team.displayName} (${team.id})`);
}

if (teams.length === 0) {
  console.log('No teams found.');
  process.exit(0);
}

const teamIndex = Number(Bun.argv[2] ?? 0);
if (isNaN(teamIndex) || teamIndex < 0 || teamIndex >= teams.length) {
  console.error(`Invalid team index. Use 0-${teams.length - 1}`);
  process.exit(1);
}

const team = teams[teamIndex]!;
console.log(`\nExploring team: ${team.displayName}\n`);

const channels = await listChannels(token, team.id);
console.log('Channels:');
for (const [i, ch] of channels.entries()) {
  console.log(`  [${i}] ${ch.displayName} (${ch.id})`);
}

try {
  const members = await listTeamMembers(token, team.id);
  console.log('\nMembers:');
  for (const [i, m] of members.entries()) {
    console.log(`  [${i}] ${m.displayName} (${m.mail ?? m.userPrincipalName ?? m.id})`);
  }
} catch {
  console.log('\nMembers: (no permission to list — need TeamMember.Read.All)');
}

// List group chats
console.log('\n--- Group Chats ---\n');
try {
  const chats = await listMyChats(token);
  const groupChats = chats.filter((c) => c.chatType === 'group');

  if (groupChats.length === 0) {
    console.log('No group chats found.');
  } else {
    for (const [i, chat] of groupChats.entries()) {
      const label = chat.topic || '(no topic)';
      console.log(`  [${i}] ${label} (${chat.id})`);
      try {
        const members = await listChatMembers(token, chat.id);
        const names = members.map((m) => m.displayName).join(', ');
        console.log(`      Members: ${names}`);
      } catch {
        // skip if no permission
      }
    }
  }
} catch (e) {
  console.log(`Could not list chats: ${e}`);
}
