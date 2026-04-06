import { fetchPersonalOpenPRsAndMore } from '../../bitbucket/client.ts';
import { env } from '../../config/env.ts';
import type { PrReviewSpammerJob } from '../../config/jobs.ts';
import {
  createNeedsQALines,
  createNeedsReviewLines,
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
  const pullRequests = await fetchPersonalOpenPRsAndMore(
    { baseUrl: env.BITBUCKET_HOST, apiToken: env.BITBUCKET_API_TOKEN },
    config.bitbucketUsers,
  );

  const [needsReview, needsQa] = await filterByApprovalThreshold(pullRequests, config);

  if (!needsReview.length && !needsQa.length) {
    console.log(`[${name}] All PRs have enough approvals. Nothing to send.`);
    return;
  }

  const needsReviewLines = createNeedsReviewLines(needsReview);
  const needsQALines = createNeedsQALines(needsQa);

  const title = getMessageTitle(config.tone);

  const needsReviewText = needsReviewLines.length
    ? needsReviewLines.join('<br>')
    : 'No PRs for code review.';

  const needsQaText = needsQALines
    ? '<br>' + '<b>\u2705 Code reviewed \u2014 QA needed:</b>' + '<br>' + needsQALines.join('<br>')
    : '';

  const message = title + '<br>' + needsReviewText + needsQaText;

  // 5. Send the message to the target comms
  const { target } = config;
  console.log('Message to be sent: \n', message);
  return;

  await sendTeamsMessage(target, message);

  console.log(`[${name}] Sent!`);
}
