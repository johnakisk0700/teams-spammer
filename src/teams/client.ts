type GraphTeam = {
  id: string;
  displayName: string;
  description?: string;
};

type GraphChannel = {
  id: string;
  displayName: string;
  description?: string;
};

type GraphUser = {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
};

type GraphResponse<T> = {
  value: T[];
};

async function graphFetch<T>(accessToken: string, path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API ${method} ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function listMyTeams(accessToken: string): Promise<GraphTeam[]> {
  const res = await graphFetch<GraphResponse<GraphTeam>>(accessToken, "/me/joinedTeams");
  return res.value;
}

export async function listChannels(accessToken: string, teamId: string): Promise<GraphChannel[]> {
  const res = await graphFetch<GraphResponse<GraphChannel>>(accessToken, `/teams/${teamId}/channels`);
  return res.value;
}

export async function listTeamMembers(accessToken: string, teamId: string): Promise<GraphUser[]> {
  const res = await graphFetch<GraphResponse<GraphUser & { "@odata.type"?: string }>>(
    accessToken,
    `/teams/${teamId}/members`,
  );
  return res.value.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    mail: m.mail,
    userPrincipalName: m.userPrincipalName,
  }));
}

export async function sendChannelMessage(
  accessToken: string,
  teamId: string,
  channelId: string,
  messageHtml: string,
): Promise<void> {
  await graphFetch(accessToken, `/teams/${teamId}/channels/${channelId}/messages`, "POST", {
    body: {
      contentType: "html",
      content: messageHtml,
    },
  });
}

export async function sendDirectMessage(
  accessToken: string,
  recipientEmail: string,
  messageHtml: string,
): Promise<void> {
  const me = await getMe(accessToken);

  const chat = await graphFetch<{ id: string }>(accessToken, "/chats", "POST", {
    chatType: "oneOnOne",
    members: [
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${me.id}')`,
      },
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${recipientEmail}')`,
      },
    ],
  });

  // Send message in chat
  await graphFetch(accessToken, `/chats/${chat.id}/messages`, "POST", {
    body: {
      contentType: "html",
      content: messageHtml,
    },
  });
}

export async function sendChatMessage(
  accessToken: string,
  chatId: string,
  messageHtml: string,
): Promise<void> {
  await graphFetch(accessToken, `/chats/${chatId}/messages`, "POST", {
    body: {
      contentType: "html",
      content: messageHtml,
    },
  });
}

export type GraphChat = {
  id: string;
  topic: string | null;
  chatType: "oneOnOne" | "group" | "meeting";
};

export async function listMyChats(accessToken: string): Promise<GraphChat[]> {
  const res = await graphFetch<GraphResponse<GraphChat>>(accessToken, "/me/chats?$top=50");
  return res.value;
}

export async function listChatMembers(accessToken: string, chatId: string): Promise<GraphUser[]> {
  const res = await graphFetch<GraphResponse<GraphUser & { "@odata.type"?: string }>>(
    accessToken,
    `/chats/${chatId}/members`,
  );
  return res.value.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    mail: m.mail,
    userPrincipalName: m.userPrincipalName,
  }));
}

export async function getMe(accessToken: string): Promise<GraphUser> {
  return graphFetch<GraphUser>(accessToken, "/me");
}
