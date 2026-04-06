import { fetchGroupOpenPRs } from '../../bitbucket/client.ts';
import { env } from '../../config/env.ts';
import type { PrReviewSpammerJob } from '../../config/jobs.ts';
import {
  createPrLine,
  filterByApprovalThreshold,
  getMessageTitle,
  sendTeamsMessage,
} from './shared/shared.ts';

export async function runGroupPrReviewSpammer(
  name: string,
  config: PrReviewSpammerJob,
): Promise<void> {
  console.log(`[${name}] Running job...`);

  // 1. Fetch PRs
  const pullRequests = await fetchGroupOpenPRs(
    { baseUrl: env.BITBUCKET_HOST, apiToken: env.BITBUCKET_API_TOKEN },
    config.bitbucketUsers,
  );

  const prs = filterByApprovalThreshold(pullRequests, config);

  if (!prs.length) {
    console.log(`[${name}] All PRs have enough approvals. Nothing to send.`);
    return;
  }

  // Group by author slug
  const bySlug = new Map<string, typeof prs>();
  for (const entry of prs) {
    const slug = entry.pr.author.user.slug ?? 'unknown';
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(entry);
  }

  const title = getMessageTitle(config.tone);
  const userSections: string[] = [];

  for (const [slug, userPrs] of bySlug) {
    const displayName = userPrs[0]?.pr.author.user.displayName ?? slug;
    const lines = [`<b>${displayName}:</b>`, ...userPrs.map(createPrLine)];
    userSections.push(lines.join('<br>'));
  }

  const message = title + '<br>' + userSections.join('<br><br>');

  // 5. Send the message to the target comms
  const { target } = config;
  await sendTeamsMessage(target, message);

  console.log(`[${name}] Sent!`);
}
