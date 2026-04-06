import { USER_SLUGS_LIST } from '../../USER-SLUGS-LIST.ts';
import type { ReviewTitleTone } from '../core/review-spammers/shared/review-title.ts';

type ChannelTarget = { type: 'channel'; teamId: string; channelId: string };
type ChatTarget = { type: 'chat'; chatId: string };
type DmTarget = { type: 'dm'; email: string };

export type Target = ChannelTarget | ChatTarget | DmTarget;

export type JobKindList = 'personal-pr-review-spammer' | 'group-pr-review-spammer';
export type BaseJob = {
  kind: JobKindList;
  target: Target;
  intervalMs: number;
};

export interface PrReviewSpammerJob extends BaseJob {
  bitbucketUsers?: string[];
  approvalThreshold?: number;
  qaThreshold?: number;
  tone: ReviewTitleTone;
}

// Add new job types here:
// export type SomeOtherJob = { kind: 'some-other'; intervalMs: number; ... };

export type JobConfig = PrReviewSpammerJob; // | SomeOtherJob
export const jobs: Record<string, JobConfig> = {
  // spam_yannis_pr: {
  //   kind: 'personal-pr-review-spammer',
  //   target: {
  //     type: 'chat',
  //     chatId: '19:638cb693931741fa83e07fe24c82dba0@thread.v2',
  //   },
  //   bitbucketUsers: ['ext_bwaidacher'],
  //   tone: 'funny',
  //   intervalMs: 4 * 60 * 60 * 1000, // every 4 hours
  // },
  spam_team_branding_prs: {
    kind: 'group-pr-review-spammer',
    target: {
      type: 'chat',
      chatId: '19:638cb693931741fa83e07fe24c82dba0@thread.v2',
    },
    bitbucketUsers: USER_SLUGS_LIST,
    tone: 'funny',
    intervalMs: 4 * 60 * 60 * 1000, // every 4 hours
  },
};
