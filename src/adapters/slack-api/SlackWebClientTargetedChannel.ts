import * as slack from "@slack/web-api";
import { SNAPSHOT_COMMENT_STATE_EVENT_TYPE } from "../../core/specific-handlers/internals";
import { CHANNELS_CACHE } from "./internals/cache/CHANNELS_CACHE";
import { COMMENTS_CACHE } from "./internals/cache/COMMENTS_CACHE";
import {
    AddBookmarkArguments,
    PullRequestCommentSnapshot,
    PullrequestCommentSnapshotInSlackMetadata,
    InviteToChannelArguments,
    KickFromChannelArguments,
    SlackChannelInfo
} from "../../core/ports/SlackTargetedChannel";
import { SlackTargetedChannel } from "../../core/ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../core/ports/SendMessageArguments";
import { SlackMessageSender } from "./internals/SlackMessageSender";
import { findMessageInChannelHistory } from "./internals/findMessageInChannelHistory";

/**
 * Adapter for the Slack API that also acts as an anti-corruption layer since Slack API is not always consistent.
 * Includes caching functionality.
 */
export class SlackWebClientTargetedChannel implements SlackTargetedChannel {
    constructor(
        private readonly client: slack.WebClient,
        readonly channelInfo: SlackChannelInfo = null,
        private readonly iconEmoji: string,
        private readonly messageSender = new SlackMessageSender(client, channelInfo, iconEmoji)
    ) {
    }

    private getCommentCacheKey(reviewCommentId: number | string) {
        return `${this.channelInfo.id}-${reviewCommentId}`;
    }

    async addBookmark(options: AddBookmarkArguments): Promise<void> {
        await this.client.bookmarks.add({
            channel_id: this.channelInfo.id,
            link: options.link,
            title: options.title,
            type: "link"
        });
    }

    async setTopic(topic: string): Promise<void> {
        await this.client.conversations.setTopic({
            channel: this.channelInfo.id,
            topic: topic
        });
    }

    async inviteToChannel(options: InviteToChannelArguments): Promise<void> {
        if ((options.users || []).length === 0) {
            return;
        }
        try {
            await this.client.conversations.invite({
                channel: this.channelInfo.id,
                users: options.users.join(","),
                force: true
            });
        } catch (error: any) {
            if (
                !(error.data.errors || [error.data.error]).every(
                    (innerError: any) =>
                        innerError.error === "already_in_channel"
                )
            ) {
                throw error;
            }
        }
    }

    async kickFromChannel(options: KickFromChannelArguments): Promise<void> {
        await Promise.all(
            options.users.map(async userId => {
                try {
                    await this.client.conversations.kick({
                        channel: this.channelInfo.id,
                        user: userId
                    });
                } catch (error: any) {
                    if (error.data.error !== "not_in_channel") {
                        throw error;
                    }
                }
            })
        );
    }

    async closeChannel(): Promise<void> {
        await this.client.conversations.archive({
            channel: this.channelInfo.id
        });
        await CHANNELS_CACHE.delete(this.channelInfo.name);
        await COMMENTS_CACHE.deleteWhere(key =>
            key.startsWith(this.getCommentCacheKey(""))
        );
    }

    async sendMessage(options: SendMessageArguments) {
        await this.messageSender.sendMessage(options);
    }

    async deleteMessage(messageId: string): Promise<void> {
        await this.client.chat.delete({
            ts: messageId,
            channel: this.channelInfo.id
        });
    }

    async findLatestPullRequestCommentSnapshot(
        reviewCommentId: number | string
    ): Promise<PullRequestCommentSnapshot | null> {
        const cacheKey = this.getCommentCacheKey(reviewCommentId);
        const cachedCommentInfo = await COMMENTS_CACHE.get(cacheKey);

        if (cachedCommentInfo) return cachedCommentInfo;

        const comment = await findMessageInChannelHistory(
            this.client,
            this.channelInfo.id,
            message => {
                const eventPayload =
                    message.metadata?.event_type ===
                    SNAPSHOT_COMMENT_STATE_EVENT_TYPE
                        ? <PullrequestCommentSnapshotInSlackMetadata>(
                            message.metadata?.event_payload
                        )
                        : null;
                return (
                    eventPayload &&
                    eventPayload.commentId === reviewCommentId.toString()
                );
            }
        );

        if (comment) {
            const metadata = <PullrequestCommentSnapshotInSlackMetadata>(
                comment.metadata?.event_payload
            );
            const snapshot = <PullRequestCommentSnapshot>{
                commentId: metadata.commentId,
                commentParentId: metadata.commentParentId,
                resolvedDate: metadata.resolvedDate,
                slackMessageId: comment.ts,
                slackThreadId: comment.thread_ts
            };
            await COMMENTS_CACHE.set(cacheKey, snapshot);
            return snapshot;
        }

        return null;
    }
}
