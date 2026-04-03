/**
 * Predefined targets — channels or group chats.
 * Add your team's targets here so you never have to type IDs again.
 *
 * Find IDs by running: bun run explore
 */

type ChannelTarget = { type: 'channel'; teamId: string; channelId: string };
type ChatTarget = { type: 'chat'; chatId: string };

export type Target = ChannelTarget | ChatTarget;

export const targets: Record<string, Target> = {
  comms: {
    type: 'chat',
    chatId: '19:638cb693931741fa83e07fe24c82dba0@thread.v2',
  },

  // Example channel:
  // 'dev-web': {
  //   type: 'channel',
  //   teamId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  //   channelId: '19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2',
  // },
};
