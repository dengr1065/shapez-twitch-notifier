import { AppTokenAuthProvider } from "@twurple/auth";
import config from "./config.js";
import { ApiClient, HelixStream } from "@twurple/api";

// Sometimes streams are started and stopped for a short period of
// time, we don't want to send notifications twice
const REPEAT_NOTIFICATION_THRESHOLD = 300e3;

export class TwitchStreamListener {
  private callback: (stream: HelixStream) => void;
  private knownStreams: Set<string> = new Set();
  private lastNotifications: Map<string, number> = new Map();

  private api = new ApiClient({
    authProvider: new AppTokenAuthProvider(
      config.twitch.clientId,
      config.twitch.clientSecret
    ),
  });

  constructor(callback: (stream: HelixStream) => void) {
    this.callback = callback;
  }

  async update() {
    const streams = await this.fetchAllStreams();

    // Remove streams that are gone
    for (const id of this.knownStreams) {
      const exists = streams.some((stream) => stream.id === id);
      if (!exists) {
        this.knownStreams.delete(id);
      }
    }

    // Remove outdated notification cache
    const currentTime = Date.now();
    for (const [id, lastNotification] of this.lastNotifications) {
      const timeSinceNotification = currentTime - lastNotification;
      if (timeSinceNotification >= REPEAT_NOTIFICATION_THRESHOLD) {
        this.lastNotifications.delete(id);
      }
    }

    for (const stream of streams) {
      const known =
        this.knownStreams.has(stream.id) || this.lastNotifications.has(stream.userId);
      this.knownStreams.add(stream.id);

      const streamingFor = currentTime - stream.startDate.getTime();
      if (!known && streamingFor < 300e3) {
        // This is a new stream!
        this.lastNotifications.set(stream.userId, currentTime);
        this.callback.call(this, stream);
      }
    }
  }

  private async fetchAllStreams() {
    const pagination = this.api.streams.getStreamsPaginated({
      game: "518024",
      language: "en",
      type: "live",
    });

    return await pagination.getAll();
  }
}
