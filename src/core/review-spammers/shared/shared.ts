import type { BitbucketPullRequest } from '../../../bitbucket/client';
import { getPullRequestLink } from '../../../bitbucket/format';
import { env } from '../../../config/env';
import type { JobConfig, PrReviewSpammerJob } from '../../../config/jobs';
import {
  sendChannelMessage,
  sendChatMessage,
  sendDirectMessage,
} from '../../../microsoft-teams/client';
import { getRandomReviewTitle } from './review-title';

export type PRsWithApprovals = {
  pr: BitbucketPullRequest;
  approvals: number;
}[];

export async function filterByApprovalThreshold(
  pullRequests: BitbucketPullRequest[],
  config: PrReviewSpammerJob,
): Promise<[PRsWithApprovals, PRsWithApprovals]> {
  const threshold = config.approvalThreshold ?? env.APPROVAL_THRESHOLD;
  const qaThreshold = config.qaThreshold ?? env.QA_THRESHOLD;

  const prsWithApprovals: PRsWithApprovals = pullRequests.map((pr) => {
    const approvals = pr.reviewers.filter(
      (r) => r.approved && r.user.slug !== pr.author.user.slug,
    ).length;
    return { pr, approvals };
  });

  const needsReview = prsWithApprovals.filter((p) => p.approvals < qaThreshold) || [];
  const needsQa = prsWithApprovals.filter(
    (p) => p.approvals >= qaThreshold && p.approvals < threshold,
  );

  return [needsReview, needsQa] as const;
}

export function getMessageTitle(tone: JobConfig['tone']) {
  const title = getRandomReviewTitle(tone ?? 'funny');
  return `<b>${title}:</b>`;
}

export async function sendTeamsMessage(target: JobConfig['target'], message: string) {
  switch (target.type) {
    case 'dm':
      await sendDirectMessage(target.email, message);
      break;
    case 'channel':
      await sendChannelMessage(target.teamId, target.channelId, message);
      break;
    case 'chat':
      await sendChatMessage(target.chatId, message);
      break;
    default:
      console.log(
        `Messaging target was not in the list. Target object given: [${JSON.stringify(target, null, 4)}]`,
      );
  }
}

export function createNeedsReviewLines(needsReview: PRsWithApprovals) {
  if (!needsReview.length) return [];

  const lines = [];
  for (const { pr, approvals } of needsReview) {
    const link = getPullRequestLink(pr);
    lines.push(
      `\u2022 <a href="${link}">#${pr.id} ${pr.title}</a> \u2014 ${approvals}/${env.QA_THRESHOLD} approvals`,
    );
  }

  return lines;
}

export function createNeedsQALines(needsReview: PRsWithApprovals) {
  if (!needsReview.length) return [];

  const lines = [];
  for (const { pr, approvals } of needsReview) {
    const link = getPullRequestLink(pr);
    lines.push(
      `\u2022 <a href="${link}">#${pr.id} ${pr.title}</a> \u2014 ${approvals}/${env.APPROVAL_THRESHOLD} approvals \u2014 QA needed`,
    );
  }

  return lines;
}
