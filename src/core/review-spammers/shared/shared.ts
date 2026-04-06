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

export type PRWithStatus = {
  pr: BitbucketPullRequest;
  approvals: number;
  status: 'review' | 'qa';
};

export function filterByApprovalThreshold(
  pullRequests: BitbucketPullRequest[],
  config: PrReviewSpammerJob,
): PRWithStatus[] {
  const threshold = config.approvalThreshold ?? env.APPROVAL_THRESHOLD;
  const qaThreshold = config.qaThreshold ?? env.QA_THRESHOLD;

  const results: PRWithStatus[] = [];

  for (const pr of pullRequests) {
    const approvals = pr.reviewers.filter(
      (r) => r.approved && r.user.slug !== pr.author.user.slug,
    ).length;

    if (approvals < qaThreshold) {
      results.push({ pr, approvals, status: 'review' });
    } else if (approvals < threshold) {
      results.push({ pr, approvals, status: 'qa' });
    }
  }

  return results.sort((a, b) => a.approvals - b.approvals);
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

function reviewHearts(current: number, total: number): string {
  return '\uD83D\uDC9A'.repeat(current) + '\uD83E\uDD0D'.repeat(Math.max(0, total - current));
}

export function createPrLine(entry: PRWithStatus): string {
  const { pr, approvals, status } = entry;
  const link = getPullRequestLink(pr);
  const hearts = reviewHearts(approvals, env.QA_THRESHOLD);
  if (status === 'review') {
    return `\uD83D\uDD0D \u23D0 ${hearts} \u25B8 \u26AA \u2014 <a href="${link}">#${pr.id} ${pr.title}</a>`;
  }
  const qaApprovals = approvals - env.QA_THRESHOLD;
  const qaSlot = qaApprovals > 0 ? '\uD83D\uDFE2' : '\uD83D\uDFE1';
  return `\uD83E\uDDEA \u23D0 ${hearts} \u25B8 ${qaSlot} \u2014 <a href="${link}">#${pr.id} ${pr.title}</a>`;
}
