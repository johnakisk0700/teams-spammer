import { fetchOpenPullRequests } from './bitbucket/client.ts';
import { getPullRequestLink } from './bitbucket/format.ts';
import { getAccessToken } from './teams/auth.ts';
import { sendChannelMessage, sendDirectMessage } from './teams/client.ts';
import { env } from './config/env.ts';
import { channels } from './config/channels.ts';
import { getRandomReviewTitle } from './review-title.ts';

type Target =
  | { mode: 'dm'; email: string }
  | { mode: 'channel'; teamId: string; channelId: string };

type ParsedArgs = {
  target: Target;
  alsoSlug?: string;
};

function parseArgs(): ParsedArgs {
  const args = Bun.argv.slice(2);

  // Extract --also flag from anywhere in the args
  let alsoSlug: string | undefined;
  const filtered: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--also' && args[i + 1]) {
      alsoSlug = args[++i];
    } else {
      filtered.push(args[i]!);
    }
  }

  const [mode, ...rest] = filtered;

  if (mode === 'dm' && rest[0]) {
    return { target: { mode: 'dm', email: rest[0] }, alsoSlug };
  }

  if (mode === 'channel' && rest[0]) {
    const alias = channels[rest[0]];
    if (alias) {
      return {
        target: { mode: 'channel', teamId: alias.teamId, channelId: alias.channelId },
        alsoSlug,
      };
    }

    if (rest[1]) {
      return { target: { mode: 'channel', teamId: rest[0], channelId: rest[1] }, alsoSlug };
    }

    console.error(`Unknown channel alias "${rest[0]}" and no channelId provided.`);
    console.error(`Define it in src/config/channels.ts or pass both IDs.\n`);
  }

  const aliases = Object.keys(channels);
  const aliasHelp = aliases.length
    ? `\nPredefined channels:\n${aliases.map((a) => `  - ${a}`).join('\n')}\n`
    : '\nNo predefined channels yet. Add them in src/config/channels.ts\n';

  console.error(`Usage:
  bun run start dm <email>                     Send a DM to a user
  bun run start channel <alias>                Post to a predefined channel
  bun run start channel <teamId> <channelId>   Post to a channel by IDs

Options:
  --also <slug>   Also include PRs by another Bitbucket user
${aliasHelp}
Tip: use "bun run explore" to discover team/channel IDs.`);
  process.exit(1);
}

async function main(): Promise<void> {
  const { target, alsoSlug } = parseArgs();

  if (alsoSlug) {
    console.log(`Also including PRs by "${alsoSlug}"...\n`);
  }

  const pullRequests = await fetchOpenPullRequests(
    { baseUrl: env.BITBUCKET_HOST, apiToken: env.BITBUCKET_API_TOKEN },
    alsoSlug,
  );

  const threshold = env.APPROVAL_THRESHOLD;
  const QA_THRESHOLD = 2;

  const prsWithApprovals = pullRequests.map((pr) => {
    const approvals = pr.reviewers.filter(
      (r) => r.approved && r.user.slug !== pr.author.user.slug,
    ).length;
    return { pr, approvals };
  });

  const needsReview = prsWithApprovals.filter((p) => p.approvals < QA_THRESHOLD);
  const needsQa = prsWithApprovals.filter(
    (p) => p.approvals >= QA_THRESHOLD && p.approvals < threshold,
  );

  if (needsReview.length === 0 && needsQa.length === 0) {
    console.log('All PRs have enough approvals. Nothing to send!');
    return;
  }

  const lines: string[] = [];

  if (needsReview.length > 0) {
    console.log(`${needsReview.length} PRs needing review:`);
    for (const { pr, approvals } of needsReview) {
      const link = getPullRequestLink(pr);
      console.log(`  - #${pr.id} ${pr.title} (${approvals}/${QA_THRESHOLD} approvals)`);
      lines.push(
        `\u2022 <a href="${link}">#${pr.id} ${pr.title}</a> \u2014 ${approvals}/${QA_THRESHOLD} approvals`,
      );
    }
  }

  if (needsQa.length > 0) {
    console.log(`${needsQa.length} PRs needing QA:`);
    lines.push('', '<b>\u2705 Code reviewed \u2014 QA needed:</b>');
    for (const { pr, approvals } of needsQa) {
      const link = getPullRequestLink(pr);
      console.log(`  - #${pr.id} ${pr.title} (${approvals}/${threshold} \u2014 QA needed)`);
      lines.push(
        `\u2022 <a href="${link}">#${pr.id} ${pr.title}</a> \u2014 ${approvals}/${threshold} approvals \u2014 QA needed`,
      );
    }
  }

  const title = getRandomReviewTitle();
  const message = `<b>${title}:</b><br>${lines.join('<br>')}`;

  const token = await getAccessToken(env.TEAMS_TENANT_ID, env.TEAMS_CLIENT_ID);

  if (target.mode === 'dm') {
    console.log(`\nSending DM to ${target.email}...`);
    await sendDirectMessage(token, target.email, message);
  } else {
    console.log(`\nPosting to channel ${target.channelId}...`);
    await sendChannelMessage(token, target.teamId, target.channelId, message);
  }

  console.log('Sent!');
}

await main();
