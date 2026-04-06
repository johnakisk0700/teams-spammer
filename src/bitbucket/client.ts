const DASHBOARD_PULL_REQUESTS_PATH = '/rest/api/1.0/dashboard/pull-requests';

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

export async function bitbucketFetch<T>(config: BitbucketClientConfig, path: string): Promise<T> {
  const url = new URL(path, config.baseUrl);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Bitbucket request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchPersonalOpenPRsAndMore(
  config: BitbucketClientConfig,
  userSlugs?: string[],
): Promise<BitbucketPullRequest[]> {
  const allPrs: BitbucketPullRequest[] = [];
  const seen = new Set<number>();

  function addUnique(prs: BitbucketPullRequest[]) {
    for (const pr of prs) {
      if (!seen.has(pr.id)) {
        seen.add(pr.id);
        allPrs.push(pr);
      }
    }
  }

  // Fetch our own PRs (always)
  let start: number | undefined = 0;
  while (start !== undefined) {
    const p: string = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&role=AUTHOR&start=${start}`;
    const pg: BitbucketPagedResponse<BitbucketPullRequest> = await bitbucketFetch(config, p);
    addUnique(pg.values);
    start = pg.isLastPage ? undefined : pg.nextPageStart;
  }

  // Also include PRs by specific users
  if (userSlugs && userSlugs.length > 0) {
    const slugSet = new Set(userSlugs);
    let otherStart: number | undefined = 0;
    while (otherStart !== undefined) {
      const p: string = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&start=${otherStart}`;
      const pg: BitbucketPagedResponse<BitbucketPullRequest> = await bitbucketFetch(config, p);
      addUnique(
        pg.values.filter((pr: BitbucketPullRequest) => slugSet.has(pr.author.user.slug ?? '')),
      );
      otherStart = pg.isLastPage ? undefined : pg.nextPageStart;
    }
  }

  return allPrs;
}

export async function fetchGroupOpenPRs(
  config: BitbucketClientConfig,
  userSlugs?: string[],
): Promise<BitbucketPullRequest[]> {
  const allPrs: BitbucketPullRequest[] = [];
  if (userSlugs && userSlugs.length > 0) {
    const slugSet = new Set(userSlugs);
    let otherStart: number | undefined = 0;
    while (otherStart !== undefined) {
      const p: string = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&start=${otherStart}`;
      const pg: BitbucketPagedResponse<BitbucketPullRequest> = await bitbucketFetch(config, p);
      allPrs.push(
        ...pg.values.filter((pr: BitbucketPullRequest) => slugSet.has(pr.author.user.slug ?? '')),
      );
      otherStart = pg.isLastPage ? undefined : pg.nextPageStart;
    }
  }

  return allPrs;
}

export async function fetchPersonalOpenPRs(
  config: BitbucketClientConfig,
): Promise<BitbucketPullRequest[]> {
  const allPrs: BitbucketPullRequest[] = [];

  let start: number | undefined = 0;
  while (start !== undefined) {
    const p: string = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&role=AUTHOR&start=${start}`;
    const pg: BitbucketPagedResponse<BitbucketPullRequest> = await bitbucketFetch(config, p);
    allPrs.push(...pg.values);
    start = pg.isLastPage ? undefined : pg.nextPageStart;
  }

  return allPrs;
}
