Absolutely — here’s a repo-friendly overview you can paste into a README, issue, or agent prompt.

## Plan overview: manual PR review reminder script

### Goal

Build a small developer-run script that fetches the current user’s open Bitbucket PRs, determines which ones still need review under the local rule “fewer than 2 approvals from other devs,” and posts those PR links into a Teams channel. This is intentionally a lightweight dev tool, not an official always-on integration. Bitbucket Server/Data Center supports fetching PRs involving the authenticated user through `/rest/api/1.0/dashboard/pull-requests` with filters such as `state=OPEN` and `role=AUTHOR`, and the responses are paginated. ([docs.atlassian.com][1])

### Scope

The first version should do only three things:

1. Fetch open PRs authored by the current user.
2. Filter PRs whose approval count from **other** users is `< 2`.
3. Post a single human-readable Teams message with the relevant PR links.
   This should stay manual for now: run on demand from CLI, no scheduler, no webhook listener, no service deployment. Bitbucket’s REST API is explicitly intended for scripts and integrations. ([docs.atlassian.com][1])

### Bitbucket data source

Use the Bitbucket dashboard endpoint:

`GET /rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR`

That endpoint is documented to return pull requests where the authenticated user is involved, and it can be filtered by state, role, and participant status. The response is a paged object with `values`, `isLastPage`, `start`, and `nextPageStart`, so the script should loop until all pages are consumed. ([docs.atlassian.com][1])

### Approval logic

For each PR, inspect the returned PR object and count approvals from users other than the author. Atlassian’s documented response examples include `author`, `reviewers`, `participants`, and approval-related fields such as `approved`, `status`, and `lastReviewedCommit`, plus a self link for the PR. The author object in Atlassian’s own example also contains approval fields, so the script must explicitly exclude the author from the approval count. ([docs.atlassian.com][1])

### Recommended counting rule

Use this rule for v1:

* Count only users in `reviewers` whose `approved === true`
* Exclude the PR author
* Mark PR as “needs review” if count `< 2`

That is the safer interpretation because reviewers are the explicit review role in Bitbucket, while `participants` may include non-reviewers. Atlassian documents reviewer role assignment and shows reviewer approval state in the API examples. This is partly an implementation recommendation, not a direct product rule from Atlassian. ([docs.atlassian.com][1])

### Teams posting: preferred approach

If you want the post to appear as the developer running the script, use Microsoft Graph:

`POST /teams/{team-id}/channels/{channel-id}/messages`

Microsoft documents that normal channel posting uses **delegated** permissions, with `ChannelMessage.Send` as the least-privileged delegated permission. Application permissions for this API are only supported for migration scenarios, so a user-run CLI is a better fit than an app-only daemon. ([Microsoft Learn][2])

### Teams auth choice

Use Microsoft Entra device code flow for the CLI. Microsoft explicitly recommends device code flow for command-line tools or apps that do not have or do not want embedded web controls. The flow is designed for CLI-style apps and returns tokens after the user signs in interactively on another browser/device. ([Microsoft Learn][3])

### Simpler fallback

If “post exactly as my account through Graph” turns out to be too annoying, the simpler fallback is a Teams workflow webhook. Teams supports workflows triggered by “When a Teams webhook request is received,” and the workflow is authenticated with a user account and then provides an HTTP POST URL. That is easier to wire up, but it is not the same thing as a true delegated Graph call from the active CLI session. ([Microsoft Support][4])

---

## Proposed implementation shape

### Inputs / config

The script should take or read:

* Bitbucket base URL
* Bitbucket auth credentials or token/cookie strategy
* Teams team ID
* Teams channel ID
* Microsoft tenant/client/app config for delegated auth
* Required approvals threshold, default `2`

The exact Bitbucket auth mechanism depends on your server setup, but the API itself is normal HTTP/JSON and intended for scripts. ([docs.atlassian.com][1])

### High-level flow

1. Authenticate to Bitbucket.
2. Fetch all pages from `dashboard/pull-requests?state=OPEN&role=AUTHOR`.
3. Normalize each PR to a small internal model:

   * id
   * title
   * link
   * author
   * reviewers
   * approvalCount
4. Filter PRs where `approvalCount < 2`.
5. If none match, exit quietly or print a local message only.
6. If some match, authenticate to Microsoft Graph via delegated auth.
7. Post one Teams message containing the PR list.
   All of the API pieces needed for this flow are documented: Bitbucket’s filtered dashboard PR endpoint and paging model, plus Graph channel message posting. ([docs.atlassian.com][1])

### Message format

Keep the Teams message intentionally short and readable, for example:

* intro line: “PRs still needing review (< 2 approvals):”
* one bullet per PR:

  * PR title
  * current approval count
  * direct PR link

Microsoft explicitly notes that Teams messages should be messages people will actually read, not log spam, so one compact summary post is the right shape. ([Microsoft Learn][2])

---

## Edge cases to handle

### Pagination

Do not assume one page. Bitbucket’s paged APIs require following `nextPageStart` when `isLastPage` is `false`; Atlassian explicitly warns not to infer the next page by arithmetic. ([docs.atlassian.com][1])

### Author counted accidentally

Do not count author approval. Atlassian’s response example shows the author object carrying approval-related fields, so a naive count across all approval-like objects would be wrong. ([docs.atlassian.com][1])

### Missing or empty reviewers

Some PRs may have no reviewers assigned yet. Those should simply resolve to `0` approvals and still be posted as needing review. This is an inference from the documented object model and your local rule. ([docs.atlassian.com][1])

### Duplicate posts

For the manual script, duplicates are acceptable if the user runs it twice. Do not overengineer deduplication in v1.

### Teams auth friction

Graph delegated auth is the “correct” path for posting as the user, but it may require tenant/app registration and user consent depending on your org setup. Device code flow is still the right CLI-first starting point. ([Microsoft Learn][2])

---

## Suggested deliverables

### v1

* CLI command that prints matching PRs locally
* Bitbucket pagination handled
* Approval count logic implemented
* No Teams posting yet

### v2

* Microsoft Graph delegated auth via device code flow
* Teams channel post working
* One summary message for all matching PRs

### v3

* Config file / env support
* Better output formatting
* Optional dry-run mode
* Optional scheduler/cron wrapper later

This sequencing is my implementation recommendation based on the documented APIs and the likely pain point being Teams auth rather than Bitbucket querying. ([docs.atlassian.com][1])

---

## Suggested repo/task breakdown

### Task 1: Bitbucket client

Implement a small reusable module around Bitbucket HTTP so the rest of the script never calls `fetch` directly.

Suggested function boundaries:

* `bitbucketFetch<T>(config, request)`
* `fetchAllAuthoredOpenPullRequests(config)`

Responsibilities of `bitbucketFetch<T>`:

* Build URL safely from `baseUrl + path + query`.
* Apply auth header in one place.
* Parse JSON response.
* Throw typed/consistent errors for non-2xx responses and timeouts.

Responsibilities of `fetchAllAuthoredOpenPullRequests(config)`:

* Call `GET /rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR`.
* Follow Bitbucket pagination using `isLastPage` and `nextPageStart`.
* Return a single merged array of PRs.

Suggested config contract for v1:

* `BITBUCKET_BASE_URL`
* One auth strategy:

  * `BITBUCKET_AUTH_HEADER` (full `Authorization` header value)
  * or `BITBUCKET_TOKEN` (Bearer token)
  * or `BITBUCKET_USERNAME` + `BITBUCKET_PASSWORD` (Basic auth)

This keeps all transport/auth concerns isolated and makes later Teams work independent from Bitbucket details. ([docs.atlassian.com][1])

### Task 2: PR readiness evaluator

Convert raw PR payloads into a simple internal shape and compute `approvalCount` from non-author reviewers with `approved === true`. ([docs.atlassian.com][1])

### Task 3: CLI output

Print a readable local summary so the core logic can be verified before touching Teams.

### Task 4: Teams auth

Add delegated Microsoft auth using device code flow for CLI usage. ([Microsoft Learn][3])

### Task 5: Teams poster

Post a single message to `POST /teams/{team-id}/channels/{channel-id}/messages`. ([Microsoft Learn][2])

### Task 6: Config / polish

Add `.env`, error handling, and maybe `--dry-run`.

---

## Recommended default decision

Start with:

* **Bitbucket dashboard API**
* **Count approvals from `reviewers` only**
* **Microsoft Graph delegated auth with device code**
* **One Teams summary message per run**

That is the cleanest match for your “manual dev script, post using my account” requirement. The webhook/workflow route is a valid fallback only if Graph auth becomes organizationally annoying. ([docs.atlassian.com][1])

I can also turn this into a cleaner **agent prompt + repo TODO.md** in the next message.

[1]: https://docs.atlassian.com/bitbucket-server/rest/7.6.0/bitbucket-rest.html "REST Resources Provided By: Bitbucket Server - REST"
[2]: https://learn.microsoft.com/en-us/graph/api/channel-post-messages?view=graph-rest-1.0 "Send chatMessage in a channel - Microsoft Graph v1.0 | Microsoft Learn"
[3]: https://learn.microsoft.com/en-us/entra/identity-platform/scenario-desktop-acquire-token-device-code-flow "Acquire a token to call a web API using device code flow (desktop app) - Microsoft identity platform | Microsoft Learn"
[4]: https://support.microsoft.com/en-us/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498 "Create incoming webhooks with Workflows for Microsoft Teams - Microsoft Support"
