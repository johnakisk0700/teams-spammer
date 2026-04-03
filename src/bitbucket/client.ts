const DASHBOARD_PULL_REQUESTS_PATH = "/rest/api/1.0/dashboard/pull-requests";

export type BitbucketClientConfig = {
  baseUrl: string;
  apiToken: string;
};

type BitbucketPagedResponse<T> = {
  values: T[];
  isLastPage: boolean;
  nextPageStart?: number;
};

type BitbucketUserRef = {
  slug?: string;
  name?: string;
  displayName?: string;
};

type BitbucketReviewer = {
  user: BitbucketUserRef;
  approved?: boolean;
};

type BitbucketLink = {
  href: string;
};

type BitbucketLinks = {
  self?: BitbucketLink[];
};

export type BitbucketPullRequest = {
  id: number;
  title: string;
  author: {
    user: BitbucketUserRef;
  };
  reviewers: BitbucketReviewer[];
  links?: BitbucketLinks;
};

export async function bitbucketFetch<T>(
  config: BitbucketClientConfig,
  path: string,
): Promise<T> {
  const url = new URL(path, config.baseUrl);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Bitbucket request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchOpenPullRequests(
  config: BitbucketClientConfig,
  alsoAuthorSlug?: string,
): Promise<BitbucketPullRequest[]> {
  const allPrs: BitbucketPullRequest[] = [];

  // Always fetch our own PRs
  let start: number | undefined = 0;
  while (start !== undefined) {
    const path = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&role=AUTHOR&start=${start}`;
    const page = await bitbucketFetch<BitbucketPagedResponse<BitbucketPullRequest>>(config, path);
    allPrs.push(...page.values);
    start = page.isLastPage ? undefined : page.nextPageStart;
  }

  // Optionally also include another user's PRs (ones we're involved in)
  if (alsoAuthorSlug) {
    const seen = new Set(allPrs.map((pr) => pr.id));
    let otherStart: number | undefined = 0;
    while (otherStart !== undefined) {
      const p: string = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&start=${otherStart}`;
      const pg: BitbucketPagedResponse<BitbucketPullRequest> = await bitbucketFetch(config, p);
      for (const pr of pg.values) {
        if (pr.author.user.slug === alsoAuthorSlug && !seen.has(pr.id)) {
          allPrs.push(pr);
          seen.add(pr.id);
        }
      }
      otherStart = pg.isLastPage ? undefined : pg.nextPageStart;
    }
  }

  return allPrs;
}
