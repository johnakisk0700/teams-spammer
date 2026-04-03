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

export async function fetchAllAuthoredOpenPullRequests(
  config: BitbucketClientConfig,
): Promise<BitbucketPullRequest[]> {
  const pullRequests: BitbucketPullRequest[] = [];
  let start: number | undefined = 0;

  while (start !== undefined) {
    const path = `${DASHBOARD_PULL_REQUESTS_PATH}?state=OPEN&role=AUTHOR&start=${start}`;
    const page: BitbucketPagedResponse<BitbucketPullRequest> =
      await bitbucketFetch<BitbucketPagedResponse<BitbucketPullRequest>>(
        config,
        path,
      );

    pullRequests.push(...page.values);
    start = page.isLastPage ? undefined : page.nextPageStart;
  }

  return pullRequests;
}
