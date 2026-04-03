import {
  fetchAllAuthoredOpenPullRequests,
} from "./bitbucket/client.ts";
import { getPullRequestLink } from "./bitbucket/format.ts";
import { env } from "./config/env.ts";

async function main(): Promise<void> {
  const pullRequests = await fetchAllAuthoredOpenPullRequests({
    baseUrl: env.BITBUCKET_HOST,
    apiToken: env.BITBUCKET_API_TOKEN,
  });

  console.log(`Found ${pullRequests.length} open authored pull requests.`);
  for (const pullRequest of pullRequests) {
    console.log(`- #${pullRequest.id} ${pullRequest.title}`);
    console.log(`  ${getPullRequestLink(pullRequest)}`);
  }
}

await main();
