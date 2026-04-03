## PR Review Reminder Script

### What it does

1. Fetches your open Bitbucket PRs
2. Filters ones with < N approvals from other devs (default 2, configurable via `APPROVAL_THRESHOLD`)
3. Posts them to a Teams channel or DMs a user so people actually review them

### How it works

**Bitbucket side:**
- Hits `GET /rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR`
- Handles pagination
- Counts approvals from `reviewers` only (not author, not participants)

**Teams side:**
- Uses Microsoft Graph API with device code flow (you sign in via browser once, token gets cached)
- Posts to a channel: `POST /teams/{team-id}/channels/{channel-id}/messages`
- Or DMs a user directly via one-on-one chat

### Setup

1. Create an Azure AD app registration (public client, mobile/desktop redirect)
2. Add API permissions: `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Chat.ReadWrite`, `User.Read`, `User.ReadBasic.All`
3. Fill in `.env` with your tenant ID and client ID

### Running

```bash
# Send a DM reminder to someone
bun run start dm user@company.com

# Post to a Teams channel
bun run start channel <teamId> <channelId>

# Explore your teams/channels/people (to find IDs)
bun run explore
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `BITBUCKET_HOST` | Yes | Bitbucket server URL |
| `BITBUCKET_API_TOKEN` | Yes | Bitbucket API token |
| `TEAMS_TENANT_ID` | Yes | Azure AD tenant ID |
| `TEAMS_CLIENT_ID` | Yes | Microsoft Graph client ID |
| `APPROVAL_THRESHOLD` | No | Min approvals needed (default: 2) |
