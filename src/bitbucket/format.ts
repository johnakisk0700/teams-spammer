import type { BitbucketPullRequest } from "./client.ts";

export function getPullRequestLink(
  pullRequest: Pick<BitbucketPullRequest, "links">,
): string {
  return pullRequest.links?.self?.[0]?.href ?? "(missing self link)";
}
