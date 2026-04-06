import { fetchPersonalOpenPRsAndMore } from '../../bitbucket/client.ts';
import { env } from '../../config/env.ts';
import type { PrReviewSpammerJob } from '../../config/jobs.ts';
import {
  createPrLine,
  filterByApprovalThreshold,
  getMessageTitle,
  sendTeamsMessage,
} from './shared/shared.ts';

export async function runPersonalPrReviewSpammer(
  name: string,
  config: PrReviewSpammerJob,
): Promise<void> {
  console.log(`[${name}] Running job...`);

  // 1. Fetch PRs
  const pullRequests = await fetchPersonalOpenPRsAndMore(
    { baseUrl: env.BITBUCKET_HOST, apiToken: env.BITBUCKET_API_TOKEN },
    config.bitbucketUsers,
  );

  const prs = filterByApprovalThreshold(pullRequests, config);

  if (!prs.length) {
    console.log(`[${name}] All PRs have enough approvals. Nothing to send.`);
    return;
  }

  const title = getMessageTitle(config.tone);
  const message = title + '<br>' + prs.map(createPrLine).join('<br>');

  // 5. Send the message to the target comms
  const { target } = config;
  await sendTeamsMessage(target, message);

  console.log(`[${name}] Sent!`);
}
