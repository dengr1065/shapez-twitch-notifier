import config from "../config.json" assert { type: "json" };

export default {
  discord: {
    token: config.discord.bot_token,
    guildId: config.discord.guild_id,
    channelId: config.discord.channel_id,
  },
  twitch: {
    clientId: config.twitch.client_id,
    clientSecret: config.twitch.client_secret,
  },
};
