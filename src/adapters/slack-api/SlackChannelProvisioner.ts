import * as slack from "@slack/web-api";
import { SlackWebClientBroadcastChannel } from "./SlackWebClientBroadcastChannel";
import { PullRequestEvent } from "../../web-app/notification-handlers/event-contracts";
import { buildChannelName } from "./buildChannelName";
import { CHANNELS_CACHE } from "./internals/cache/CHANNELS_CACHE";

import { SlackChannelInfo } from "../../web-app/notification-handlers/ports/SlackTargetedChannel";
import { SlackBroadcastChannel } from "../../web-app/notification-handlers/ports/SlackBroadcastChannel";
import { SlackTargetedChannel } from "../../web-app/notification-handlers/ports/SlackTargetedChannel";
import { SlackWebClientTargetedChannel } from "./SlackWebClientTargetedChannel";

export class SlackChannelProvisioner {
    constructor(private readonly client: slack.WebClient) {}

    async findBroadcastChannel(channelName: string, iconEmoji: BotEconEmoji): Promise<SlackBroadcastChannel | null> {
        const channelInfo = await this.tryFindChannel(channelName);
        return channelInfo ? new SlackWebClientBroadcastChannel(this.client, channelInfo, iconEmoji) : null;
    }

    async provisionTargetedChannel(payload: PullRequestEvent, iconEmoji: BotEconEmoji, defaultChannelParticipants: string[]): Promise<SlackTargetedChannel> {
        const channelName = buildChannelName(payload.pullRequest);
        const channelInfo = await CHANNELS_CACHE.wrap(channelName, async () => {
            return this.setupChannel(channelName, payload, iconEmoji, defaultChannelParticipants);
        });

        return new SlackWebClientTargetedChannel(this.client, channelInfo, iconEmoji);
    }

    async tryFindChannel(channelName: string): Promise<SlackChannelInfo | null> {
        const cachedChannelInfo = await CHANNELS_CACHE.get(channelName);
        if (cachedChannelInfo) {
            return cachedChannelInfo;
        }

        try {
            return await this.findExistingChannel(channelName);
        } catch (error: any) {
            if (["is_archived", "channel_not_found"].includes(error.data?.error)) {
                return null;
            }
            throw error;
        }
    }

    /*
     * The order of payloads is not guaranteed, so there can be different scenarios.
     * - For "pr:opened" event, we try to create a new channel by default. But it already may exist if another payload went first.
     * - For other events, we try to find an existing channel. But it may not exist, if "pr:opened" payload wasn't delivered first.
     * - The last point is that channel was archived because PR was merged, but latter the comment had arrived. In this case, we need to unarchive the channel.
     * */
    private async setupChannel(
        channelName: string,
        payload: PullRequestEvent,
        iconEmoji: BotEconEmoji,
        defaultChannelParticipants: string[]
    ): Promise<SlackChannelInfo> {
        const allParticipantsToInvite = [
            ...new Set(
                defaultChannelParticipants.concat([payload.pullRequest.author, ...payload.pullRequest.participants.map(r => r.user)].map(u => u.slackUserId))
            )
        ];

        const createChannelWithFallbacks = async () => {
            try {
                return await this.createNewChannel(channelName, allParticipantsToInvite, iconEmoji);
            } catch (error: any) {
                if (error.data?.error !== "name_taken") {
                    throw error;
                }
                try {
                    return await this.findExistingChannel(channelName);
                } catch (innerError: any) {
                    if (innerError.data?.error === "is_archived") {
                        return await this.tryUnarchiveChannel(channelName);
                    }
                    throw innerError;
                }
            }
        };

        if (payload.eventKey === "pr:opened") {
            return createChannelWithFallbacks();
        }

        if (payload.eventKey === "pr:reopened") {
            const channel = await this.tryUnarchiveChannel(channelName);
            return channel || createChannelWithFallbacks();
        }

        // For other events, try finding the existing channel first, then fall back to creating if not found
        try {
            return await this.findExistingChannel(channelName);
        } catch (error: any) {
            if (error.data?.error === "channel_not_found") {
                return await createChannelWithFallbacks();
            }
            if (error.data?.error === "is_archived") {
                return await this.tryUnarchiveChannel(channelName);
            }
            throw error;
        }
    }

    private async tryUnarchiveChannel(channelName: string): Promise<SlackChannelInfo | null> {
        let cursor: string;
        do {
            // noinspection JSUnusedAssignment
            const result = await this.client.conversations.list({
                exclude_archived: false,
                types: "private_channel",
                limit: 1000,
                cursor
            });
            const archivedChannel = result.channels?.find(channel => channel.name === channelName && channel.is_archived);
            if (archivedChannel) {
                await this.client.conversations.unarchive({
                    channel: archivedChannel.id
                });
                return {
                    id: archivedChannel.id,
                    name: channelName
                } as SlackChannelInfo;
            }
            cursor = result.response_metadata?.next_cursor;
        } while (cursor);
        return null;
    }

    private async createNewChannel(channelName: string, participants: string[], iconEmoji: BotEconEmoji): Promise<SlackChannelInfo> {
        const response = await this.client.conversations.create({
            name: channelName,
            is_private: true
        });
        const channelInfo = { id: response.channel.id, name: response.channel.name };
        await new SlackWebClientTargetedChannel(this.client, channelInfo, iconEmoji).inviteToChannel(...participants);
        return channelInfo;
    }

    private async findExistingChannel(channelName: string): Promise<SlackChannelInfo | null> {
        const futureDate = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000); // 24 hours later
        const result = await this.client.chat.scheduleMessage({
            channel: channelName,
            post_at: futureDate,
            text: "Detecting channel ID. If you see this, something went wrong with the Slack bot setup."
        });
        await this.client.chat.deleteScheduledMessage({
            channel: channelName,
            scheduled_message_id: result.scheduled_message_id
        });
        return { id: result.channel, name: channelName };
    }
}

export type BotEconEmoji = ":github:";
