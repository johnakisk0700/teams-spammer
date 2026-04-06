import type { JobConfig } from '../config/jobs.ts';
import { runGroupPrReviewSpammer } from './review-spammers/group-pr-review-spammer.ts';
import { runPersonalPrReviewSpammer } from './review-spammers/personal-pr-review-spammer.ts';

export async function runJob(name: string, config: JobConfig): Promise<void> {
  switch (config.kind) {
    case 'personal-pr-review-spammer':
      return runPersonalPrReviewSpammer(name, config);
    case 'group-pr-review-spammer':
      return runGroupPrReviewSpammer(name, config);
    default:
      console.error(`[${name}] Unknown job kind: ${(config as any).kind}`);
  }
}
