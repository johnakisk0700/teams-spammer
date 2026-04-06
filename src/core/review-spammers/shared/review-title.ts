const FUNNY_REVIEW_TITLES = [
  "👀 These PRs have been staring at you for a while now",
  "🧟 Zombie PRs are rising from the review graveyard",
  "🚨 Approvals needed or the intern deploys at 5pm",
  "🍕 Review these PRs and nobody gets pineapple on their pizza",
  "🪦 Here lies productivity, killed by pending reviews",
  "🐛 Schrödinger's PRs: both buggy and fine until you review them",
  "🔥 This is fine. Everything is fine. Please review.",
  "💀 PRs so old they qualify for a pension",
  "🎰 Spin the wheel of 'what could possibly go wrong'",
  "🏚️ These PRs have been open longer than some relationships",
  "📢 Your code reviews called. They miss you.",
  "🧊 These PRs are gathering frost in the review queue",
  "🦴 Some PRs are aging like fine wine. These are not.",
  "🫠 The review queue is giving existential crisis",
  "🎪 Step right up! Witness the incredible unreviewed PR!",
  "🗿 These PRs are becoming ancient artifacts",
  "🐌 Breaking news: PRs still waiting. World keeps spinning.",
  "☠️ The backlog sends its regards",
  "🪤 Free code reviews! (It's not a trap, probably)",
  "🧨 Tick tock. The merge conflicts are multiplying.",
] as const;

const SERIOUS_REVIEW_TITLES = [
  "📋 Action required: PRs awaiting your review",
  "⏳ Review backlog — approvals needed to unblock merges",
  "🔍 Code reviews pending — please prioritize",
  "🚦 Blocked PRs: waiting on reviewer approval",
  "📊 Review queue status: items need attention",
  "⚠️ Stale PRs approaching merge conflict risk",
  "📌 Reminder: unreviewed pull requests in your queue",
  "🔒 PRs awaiting approval before release cutoff",
  "📬 Outstanding review requests — team velocity depends on you",
  "🛑 Review bottleneck: PRs aging in the queue",
  "📆 Daily review digest — open items need action",
  "🎯 High-priority PRs pending review",
  "⏰ Time-sensitive: PRs waiting for sign-off",
  "📈 Unblock the pipeline: reviews needed",
  "🔔 Review nudge — authors are waiting on feedback",
  "📝 Open PRs requiring your attention",
  "🚀 Clear the queue: PRs ready for final review",
  "💼 Pending reviews — don't let these go stale",
  "🔗 Dependent PRs blocked on your approval",
  "📣 Review roundup — here's what needs your eyes",
] as const;

const MIXED_REVIEW_TITLES = [...FUNNY_REVIEW_TITLES, ...SERIOUS_REVIEW_TITLES] as const;

export type ReviewTitleTone = "funny" | "serious" | "mixed";

function pickRandom<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index] as T;
}

export function getRandomReviewTitle(tone: ReviewTitleTone = "funny"): string {
  switch (tone) {
    case "funny":
      return pickRandom(FUNNY_REVIEW_TITLES);
    case "serious":
      return pickRandom(SERIOUS_REVIEW_TITLES);
    case "mixed":
    default:
      return pickRandom(MIXED_REVIEW_TITLES);
  }
}
