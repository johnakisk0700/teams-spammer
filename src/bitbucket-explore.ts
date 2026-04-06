import { bitbucketFetch } from './bitbucket/client.ts';
import { env } from './config/env.ts';

type BitbucketUser = {
  slug: string;
  displayName: string;
  emailAddress?: string;
};

type PagedResponse<T> = {
  values: T[];
  isLastPage: boolean;
  nextPageStart?: number;
};

const config = { baseUrl: env.BITBUCKET_HOST, apiToken: env.BITBUCKET_API_TOKEN };

const users: BitbucketUser[] = [];
let start: number | undefined = 0;

while (start !== undefined) {
  const page = await bitbucketFetch<PagedResponse<BitbucketUser>>(
    config,
    `/rest/api/1.0/users?start=${start}&limit=100`,
  );
  users.push(...page.values);
  start = page.isLastPage ? undefined : page.nextPageStart;
}

console.log(`Found ${users.length} users:\n`);
for (const user of users) {
  console.log(`  slug: ${user.slug}  |  name: ${user.displayName}  |  email: ${user.emailAddress ?? '—'}`);
}
