import * as slack from "@slack/web-api";
import { SNAPSHOT_PULL_REQUEST_STATE_EVENT_TYPE } from "../../web-app/pr-notification-handlers/specific-handlers/internals/snapshotPullRequestState";
import { SlackChannelInfo } from "../../web-app/pr-notification-handlers/ports/SlackTargetedChannel";
import { SlackBroadcastChannel, PullRequestSnapshotInSlackMetadata } from "../../web-app/pr-notification-handlers/ports/SlackBroadcastChannel";
import { SendMessageArguments } from "../../web-app/pr-notification-handlers/ports/SendMessageArguments";
import { SlackMessageSender } from "./internals/SlackMessageSender";
import { findMessageInChannelHistory } from "./internals/findMessageInChannelHistory";

export class SlackWebClientBroadcastChannel implements SlackBroadcastChannel {
    constructor(
        private readonly client: slack.WebClient,
        readonly channelInfo: SlackChannelInfo = null,
        iconEmoji: string,
        private readonly messageSender = new SlackMessageSender(client, channelInfo, iconEmoji)
    ) {}

    async addReaction(messageId: string, reaction: string): Promise<void> {
        try {
            await this.client.reactions.add({
                channel: this.channelInfo.id,
                timestamp: messageId,
                name: reaction
            });
        } catch (error: any) {
            if (error.data.error !== "already_reacted") {
                throw error;
            }
        }
    }

    async sendMessage(options: SendMessageArguments) {
        await this.messageSender.sendMessage(options);
    }

    async findPROpenedBroadcastMessageId(prCreationDate: Date, pullRequestTraits: PullRequestSnapshotInSlackMetadata): Promise<string | null> {
        const message = await findMessageInChannelHistory(
            this.client,
            this.channelInfo.id,
            message => {
                const eventPayload =
                    message.metadata?.event_type === SNAPSHOT_PULL_REQUEST_STATE_EVENT_TYPE
                        ? <PullRequestSnapshotInSlackMetadata>message.metadata?.event_payload
                        : null;
                return (
                    eventPayload &&
                    eventPayload.pullRequestId === pullRequestTraits.pullRequestId &&
                    eventPayload.projectKey === pullRequestTraits.projectKey &&
                    eventPayload.repositorySlug === pullRequestTraits.repositorySlug
                );
            },
            prCreationDate
        );

        return message?.ts || null;
    }
}
