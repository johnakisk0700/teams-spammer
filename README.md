# Teams PR Reminder

Fetches your open Bitbucket PRs and pings people on Teams to actually review them.

## How it works

1. Pulls all your open PRs from Bitbucket Server
2. Filters out the ones that already have enough approvals
3. Sends a nicely formatted message to a Teams channel or DM with links to each PR
4. PRs with 2+ approvals but still under the threshold show separately as "QA needed"

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime
- A Bitbucket Server API token ([create one here](https://git.ringana.com/plugins/servlet/access-tokens/manage))
- An Azure AD app registration with these API permissions:
  - `Team.ReadBasic.All`
  - `Channel.ReadBasic.All`
  - `ChannelMessage.Send`
  - `Chat.ReadWrite`
  - `User.Read`
  - `User.ReadBasic.All`

### Install

```bash
bun install
cp .env.example .env
# Fill in your values
```

### Teams login

On first run you'll be prompted to sign in via browser (device code flow). After that, the token is cached in `.teams-token.json` and auto-refreshes for ~90 days.

## Usage

```bash
# DM someone
bun run start dm someone@ringana.com

# Post to a channel (by IDs)
bun run start channel <teamId> <channelId>

# Post to a predefined channel (see below)
bun run start channel my-team

# Also include another user's PRs (e.g. you took over their work)
bun run start dm someone@ringana.com --also ext_bwaidacher
```

### Predefined channels

Instead of typing team/channel IDs every time, add aliases in `src/config/channels.ts`:

```ts
export const channels: Record<string, { teamId: string; channelId: string }> = {
  'my-team': {
    teamId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    channelId: '19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2',
  },
};
```

Find your team/channel IDs by running:

```bash
bun run explore
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `BITBUCKET_HOST` | Yes | Bitbucket server URL |
| `BITBUCKET_API_TOKEN` | Yes | Your Bitbucket personal access token |
| `TEAMS_TENANT_ID` | Yes | Azure AD tenant ID |
| `TEAMS_CLIENT_ID` | Yes | Azure AD app client ID |
| `APPROVAL_THRESHOLD` | No | Total approvals needed including QA (default: 3) |
