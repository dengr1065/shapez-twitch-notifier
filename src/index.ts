import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";
import config from "./config.js";
import { TwitchStreamListener } from "./twitch.js";
import { HelixStream } from "@twurple/api";

const bot = new Client({
  intents: [GatewayIntentBits.Guilds],
});

await bot.login(config.discord.token);

const guild = await bot.guilds.fetch(config.discord.guildId);
const channel = await guild.channels.fetch(config.discord.channelId);

if (!channel?.isTextBased()) {
  throw new Error("Not a text based channel");
}

async function sendMessage(stream: HelixStream) {
  if (!channel?.isTextBased()) {
    throw new Error("Not a text based channel");
  }

  const embed = new EmbedBuilder() //
    .setTitle(`${stream.userDisplayName} is streaming ${stream.gameName}!`)
    .setDescription(stream.title)
    .setColor(0x9147ff)
    .setThumbnail(stream.getThumbnailUrl(320, 180))
    .setTimestamp(stream.startDate);

  const button = new ButtonBuilder() //
    .setLabel(`Watch ${stream.userDisplayName}`)
    .setStyle(ButtonStyle.Link)
    .setURL(`https://twitch.tv/${stream.userName}`);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await channel.send({
    embeds: [embed],
    components: [row],
  });
}

const listener = new TwitchStreamListener((stream) => {
  sendMessage(stream);
});

await listener.update();
setInterval(listener.update.bind(listener), 60e3);
