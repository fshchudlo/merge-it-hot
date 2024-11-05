import * as slack from "@slack/web-api";
import { SlackWebClientChannel } from "./slack-channel/SlackWebClientChannel";
import { PullRequestEvent } from "../../pr-events-handling/event-contracts";
import { buildChannelName } from "./buildChannelName";
import { CHANNELS_CACHE } from "./CHANNELS_CACHE";
import { SlackChannelCachedDecorator } from "./slack-channel/SlackChannelCachedDecorator";

import { SlackBroadcastChannel, SlackTargetedChannel } from "../../pr-events-handling/slack-api-ports";

export class SlackChannelProvisioner {
    private readonly client: slack.WebClient;

    constructor(client: slack.WebClient) {
        this.client = client;
    }

    async findBroadcastChannel(channelName: string, iconEmoji: BotEconEmoji): Promise<SlackBroadcastChannel | null> {
        const channelInfo = await this.findTargetedChannelInfo(channelName);
        return channelInfo ? new SlackChannelCachedDecorator(new SlackWebClientChannel(this.client, channelInfo, iconEmoji)) : null;
    }

    async provisionTargetedChannel(payload: PullRequestEvent, iconEmoji: BotEconEmoji, usePrivateChannels: boolean, defaultChannelParticipants: string[]): Promise<SlackTargetedChannel> {
        const channelName = buildChannelName(payload.pullRequest);
        const channelInfo = await CHANNELS_CACHE.wrap(channelName, async () => {
            return await this.instantiateChannel(channelName, payload, iconEmoji, usePrivateChannels, defaultChannelParticipants);
        });
        return new SlackChannelCachedDecorator(new SlackWebClientChannel(this.client, channelInfo, iconEmoji));
    }

    async findTargetedChannelInfo(channelName: string): Promise<SlackChannelInfo | null> {
        const cachedChannelInfo = await CHANNELS_CACHE.get(channelName);
        if (cachedChannelInfo) {
            return cachedChannelInfo;
        }
        try {
            return await this.findExistingChannel(channelName);
        } catch (error: any) {
            if (error.data?.error == "is_archived" || error.data?.error == "channel_not_found") {
                return null;
            }
            throw error;
        }
    }

    /*
* The order of payloads is not guaranteed, so there can be different scenarios.
* - For "pr:opened" event, we try to create a new channel by default. But it already may exist.
* - For other events, we try to find an existing channel. If it doesn't exist, we create a new one.
* - The last resort is that channel was archived, and we need to unarchive it then.
* */
    private async instantiateChannel(channelName: string, payload: PullRequestEvent, iconEmoji: BotEconEmoji, usePrivateChannels: boolean, defaultChannelParticipants: string[]): Promise<SlackChannelInfo> {
        const allParticipantsToInvite = [...new Set(defaultChannelParticipants.concat([payload.pullRequest.author, ...payload.pullRequest.participants.map(r => r.user)].map(u => u.slackUserId)))];

        const createOrFindChannel = async () => {
            try {
                return (await this.setupNewChannel({
                    name: channelName,
                    isPrivate: usePrivateChannels,
                    defaultParticipants: allParticipantsToInvite,
                    iconEmoji
                })).channelInfo;
            } catch (error: any) {
                // If channel exists while we got "pr:opened" event, that means incorrect payloads order.
                // For that case we suppress an error. The existing channel will be found below.
                if (error.data?.error == "name_taken") {
                    return await this.findExistingChannel(channelName);
                }
                throw error;
            }
        };
        const findOrCreateChannel = async () => {
            try {
                return await this.findExistingChannel(channelName);
            } catch (error: any) {
                // If channel doesn't exist while we got event that is different from "pr:opened" event, that means incorrect payloads order or that bot was configured after this PR creation.
                // For that case we suppress an error and create new channel.
                if (error.data?.error == "channel_not_found") {
                    return (await this.setupNewChannel({
                        name: channelName,
                        isPrivate: usePrivateChannels,
                        defaultParticipants: allParticipantsToInvite,
                        iconEmoji
                    })).channelInfo;
                }
                throw error;
            }
        };
        const unarchiveChannel = async (channelName: string) => {
            let cursor: string | undefined = undefined;
            do {
                const result = await this.client.conversations.list({
                    exclude_archived: false,
                    types: "private_channel",
                    limit: 1000,
                    cursor
                });

                if (result.channels) {
                    const archivedChannel = result.channels.find((channel) => channel.name === channelName && channel.is_archived);

                    if (archivedChannel) {
                        await this.client.channels.unarchive({ channel: archivedChannel.id });
                        return {
                            id: archivedChannel.id,
                            name: channelName
                        };
                    }
                }

                cursor = result.response_metadata?.next_cursor;
            } while (cursor);

            return null;
        };

        if (payload.eventKey == "pr:opened") {
            return await createOrFindChannel();
        }
        if (payload.eventKey == "pr:reopened") {
            return (await unarchiveChannel(channelName)) || await createOrFindChannel();
        }

        try {
            return findOrCreateChannel();
        } catch (error: any) {
            if (error.data?.error == "is_archived") {
                return await unarchiveChannel(channelName);
            }
            throw error;
        }
    }

    private async setupNewChannel(options: CreateChannelArguments): Promise<SlackTargetedChannel> {
        const response = await this.client.conversations.create({
            name: options.name,
            is_private: options.isPrivate
        });

        const channel = new SlackWebClientChannel(this.client, {
            id: response.channel.id,
            name: response.channel.name
        }, options.iconEmoji);

        await channel.inviteToChannel({ users: options.defaultParticipants, force: true });
        return new SlackChannelCachedDecorator(channel);
    }

    private async findExistingChannel(channelName: string): Promise<SlackChannelInfo | null> {
        const someFutureDate = new Date();
        someFutureDate.setDate(someFutureDate.getDate() + 1);

        // We don't use conversations.list since it can be very slow, prone to request limiting, and it requires additional (and quite privileged) scopes for the bot
        const result = await this.client.chat.scheduleMessage({
            channel: channelName,
            post_at: Number.parseInt("" + (someFutureDate.getTime() / 1000)),
            text: "Scheduled message to detect channel id. If you see that, something went wrong with a slack bot"
        });

        await this.client.chat.deleteScheduledMessage({
            channel: channelName,
            scheduled_message_id: result.scheduled_message_id
        });
        return {
            id: result.channel,
            name: channelName
        };
    }
}

export type ProvisionResult = {
    channel: SlackTargetedChannel,
    isSetUpProperly: boolean
}
export type SlackChannelInfo = {
    id: string;
    name: string;
}
export type CreateChannelArguments = {
    name: string;
    isPrivate: boolean;
    defaultParticipants: string[];
    iconEmoji: string;
}
export type BotEconEmoji = ":bitbucket:" | ":github:";