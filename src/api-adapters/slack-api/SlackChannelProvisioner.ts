import * as slack from "@slack/web-api";
import { SlackWebClientChannel } from "./slack-channel/SlackWebClientChannel";
import { PullRequestEvent } from "../../pr-events-handler/event-contracts";
import { buildChannelName } from "./buildChannelName";
import { CHANNELS_CACHE } from "./CHANNELS_CACHE";
import { SlackChannelCachedDecorator } from "./slack-channel/SlackChannelCachedDecorator";

import { SlackBroadcastChannel, SlackTargetedChannel } from "../../pr-events-handler/slack-api-ports";

export class SlackChannelProvisioner {
    private readonly client: slack.WebClient;

    constructor(client: slack.WebClient) {
        this.client = client;
    }

    async provisionChannelFor(payload: PullRequestEvent, iconEmoji: BotEconEmoji, usePrivateChannels: boolean, defaultChannelParticipants: string[]): Promise<ProvisionResult> {
        const channelName = buildChannelName(payload.pullRequest);
        if (payload.eventKey == "pr:opened") {
            const newChannel = await this.createNewChannel({
                name: channelName,
                isPrivate: usePrivateChannels,
                defaultParticipants: defaultChannelParticipants,
                iconEmoji
            });
            return {
                channel: newChannel,
                isSetUpProperly: true
            };
        }
        const existingChannel = await this.fromExistingChannel(channelName, iconEmoji);
        if (existingChannel != null) {
            return {
                channel: existingChannel,
                isSetUpProperly: true
            };

        }

        const createdChannel = await this.createNewChannel({
            name: channelName,
            isPrivate: usePrivateChannels,
            defaultParticipants: defaultChannelParticipants,
            iconEmoji
        });
        return { channel: createdChannel, isSetUpProperly: false };
    }

    async getBroadcastChannel(channelName: string, iconEmoji: BotEconEmoji): Promise<SlackBroadcastChannel | null> {
        return this.fromExistingChannel(channelName, iconEmoji);
    }

    async getChannelInfo(channelName: string): Promise<SlackChannelInfo | null> {
        const cachedChannelInfo = await CHANNELS_CACHE.get(channelName);
        if (cachedChannelInfo) {
            return Promise.resolve(cachedChannelInfo);
        }
        const channelInfo = await this.findChannelInSlack(channelName);

        if (!channelInfo) {
            return null;
        }
        await CHANNELS_CACHE.set(channelName, channelInfo);
        return channelInfo;
    }

    private async fromExistingChannel(channelName: string, iconEmoji: string): Promise<SlackChannelCachedDecorator | null> {
        const channelInfo = await this.getChannelInfo(channelName);
        return channelInfo ? new SlackChannelCachedDecorator(new SlackWebClientChannel(this.client, channelInfo, iconEmoji)) : null;
    }

    private async createNewChannel(options: CreateChannelArguments): Promise<SlackTargetedChannel> {
        const channelInfo = await CHANNELS_CACHE.wrap(options.name, async () => {
            const response = await this.client.conversations.create({
                name: options.name,
                is_private: options.isPrivate
            });
            return {
                id: response.channel.id,
                name: response.channel.name
            };
        });

        const channel = new SlackWebClientChannel(this.client, channelInfo, options.iconEmoji);
        if (options.defaultParticipants?.length > 0) {
            await channel.inviteToChannel({ users: options.defaultParticipants, force: true });
        }
        return new SlackChannelCachedDecorator(channel);
    }

    private async findChannelInSlack(channelName: string): Promise<SlackChannelInfo | null> {
        const someFutureDate = new Date();
        someFutureDate.setDate(someFutureDate.getDate() + 1);

        // We don't use conversations.list since it can be very slow, prone to request limiting, and it requires additional (and quite privileged) scopes for the bot
        try {
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
        } catch (error: any) {
            if (error.data?.error == "is_archived" || error.data?.error == "channel_not_found") {
                return null;
            }
            throw error;
        }
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