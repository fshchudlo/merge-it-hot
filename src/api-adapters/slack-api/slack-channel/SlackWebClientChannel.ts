import * as slack from "@slack/web-api";
import { MessageElement } from "@slack/web-api/dist/response/ConversationsHistoryResponse";
import { SNAPSHOT_COMMENT_STATE_EVENT_TYPE } from "../../../pr-events-handling/event-handlers/utils";
import {
    SNAPSHOT_PULL_REQUEST_STATE_EVENT_TYPE
} from "../../../pr-events-handling/event-handlers/utils/snapshotPullRequestState";
import { SlackChannelInfo } from "../SlackChannelProvisioner";
import { CHANNELS_CACHE } from "../CHANNELS_CACHE";
import { COMMENTS_CACHE } from "../COMMENTS_CACHE";
import {
    AddBookmarkArguments, PullRequestCommentSnapshot, PullrequestCommentSnapshotInSlackMetadata,
    InviteToChannelArguments,
    KickFromChannelArguments,
    PullRequestSnapshotInSlackMetadata,
    SendMessageArguments,
    SendMessageResponse, SlackBroadcastChannel, SlackTargetedChannel
} from "../../../pr-events-handling/slack-api-ports";

/**
 * Adapter for the Slack API that also acts as an anti-corruption layer since Slack API is not always consistent.
 * Includes caching functionality.
 */
export class SlackWebClientChannel implements SlackTargetedChannel, SlackBroadcastChannel {
    private readonly client: slack.WebClient;
    private readonly iconEmoji: string;
    readonly channelInfo: SlackChannelInfo;

    constructor(client: slack.WebClient, channelInfo: SlackChannelInfo = null, iconEmoji: string) {
        this.client = client;
        this.channelInfo = channelInfo;
        this.iconEmoji = iconEmoji;
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
            if (!(error.data.errors || [error.data.error]).every((innerError: any) => innerError.error === "already_in_channel")) {
                throw error;
            }
        }
    }

    async kickFromChannel(options: KickFromChannelArguments): Promise<void> {
        await Promise.all(options.users.map(async userId => {
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
        }));
    }

    async closeChannel(): Promise<void> {
        await this.client.conversations.archive({ channel: this.channelInfo.id });
        await CHANNELS_CACHE.delete(this.channelInfo.name);
        await COMMENTS_CACHE.deleteWhere(key => key.startsWith(this.getCommentCacheKey("")));
    }

    async addReaction(messageId: string, reaction: string): Promise<void> {
        await this.client.reactions.add({
            channel: this.channelInfo.id,
            timestamp: messageId,
            name: reaction
        });
    }

    async sendMessage(options: SendMessageArguments): Promise<SendMessageResponse> {
        const response = await this.client.chat.postMessage({
            channel: this.channelInfo.id,
            icon_emoji: this.iconEmoji,
            text: options.text,
            metadata: options.metadata ? {
                event_type: options.metadata.eventType,
                event_payload: options.metadata.eventPayload
            } : undefined,
            blocks: options.blocks,
            thread_ts: options.threadId,
            reply_broadcast: options.replyBroadcast
        });

        const metadata = <PullrequestCommentSnapshotInSlackMetadata>options.metadata?.eventPayload;
        if (metadata?.commentId) {
            const commentSnapshot: PullRequestCommentSnapshot = {
                ...metadata,
                slackMessageId: response.message.ts,
                slackThreadId: response.message.thread_ts
            };
            await COMMENTS_CACHE.set(this.getCommentCacheKey(commentSnapshot.commentId), commentSnapshot);
        }

        return {
            messageId: response.message.ts,
            threadId: response.message.thread_ts
        };
    }

    async findLatestPullRequestCommentSnapshot(reviewCommentId: number | string): Promise<PullRequestCommentSnapshot | null> {
        const cacheKey = this.getCommentCacheKey(reviewCommentId);
        const cachedCommentInfo = await COMMENTS_CACHE.get(cacheKey);

        if (cachedCommentInfo) return cachedCommentInfo;

        const comment = await this.findMessageInChannelHistory(
            this.channelInfo.id,
            message => {
                const eventPayload = message.metadata?.event_type === SNAPSHOT_COMMENT_STATE_EVENT_TYPE
                    ? <PullrequestCommentSnapshotInSlackMetadata>message.metadata?.event_payload
                    : null;
                return eventPayload && eventPayload.commentId === reviewCommentId.toString();
            }
        );

        if (comment) {
            const metadata = <PullrequestCommentSnapshotInSlackMetadata>comment.metadata?.event_payload;
            const snapshot = <PullRequestCommentSnapshot>{
                commentId: metadata.commentId,
                commentParentId: metadata.commentParentId,
                threadResolvedDate: metadata.threadResolvedDate,
                taskResolvedDate: metadata.taskResolvedDate,
                severity: metadata.severity,
                slackMessageId: comment.ts,
                slackThreadId: comment.thread_ts
            };
            await COMMENTS_CACHE.set(cacheKey, snapshot);
            return snapshot;
        }

        return null;
    }

    async findPROpenedBroadcastMessageId(prCreationDate: Date, pullRequestTraits: PullRequestSnapshotInSlackMetadata): Promise<string | null> {
        const message = await this.findMessageInChannelHistory(
            this.channelInfo.id,
            message => {
                const eventPayload = message.metadata?.event_type === SNAPSHOT_PULL_REQUEST_STATE_EVENT_TYPE
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

    private async findMessageInChannelHistory(channelId: string, matchPredicate: (message: MessageElement) => boolean, oldestDate: Date | undefined = undefined): Promise<MessageElement | null> {
        let cursor: string | undefined = undefined;
        const slackTimestamp = oldestDate ? Math.floor(oldestDate.getTime() / 1000) + ".000000" : undefined;

        while (true) {
            const response = await this.client.conversations.history({
                channel: channelId,
                include_all_metadata: true,
                oldest: slackTimestamp,
                inclusive: true,
                cursor
            });

            const message = response.messages.find(matchPredicate);
            if (message) return message;

            cursor = response.response_metadata?.next_cursor;
            if (!cursor) return null;
        }
    }
}
