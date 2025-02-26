import * as slack from "@slack/web-api";
import { COMMENTS_CACHE } from "./cache/COMMENTS_CACHE";
import {
    PullRequestCommentSnapshot,
    PullrequestCommentSnapshotInSlackMetadata,
    SlackChannelInfo
} from "../../../notification-handlers/ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../../notification-handlers/ports/SendMessageArguments";

export class SlackMessageSender {
    constructor(
        private readonly client: slack.WebClient,
        readonly channelInfo: SlackChannelInfo = null,
        private readonly iconEmoji: string
    ) {
    }

    private getCommentCacheKey(reviewCommentId: number | string) {
        return `${this.channelInfo.id}-${reviewCommentId}`;
    }

    async sendMessage(options: SendMessageArguments) {
        const request = {
            channel: this.channelInfo.id,
            icon_emoji: this.iconEmoji,
            text: options.text,
            metadata: options.metadata
                ? {
                    event_type: options.metadata.eventType,
                    event_payload: options.metadata.eventPayload
                }
                : undefined,
            blocks: options.blocks,
            thread_ts: options.threadId,
            reply_broadcast: options.replyBroadcast
        };

        if (options.editMessageId) {
            const response = await this.client.chat.update({
                ...request,
                ts: options.editMessageId,
                reply_broadcast: undefined
            });
            const metadata = <PullrequestCommentSnapshotInSlackMetadata>(
                options.metadata?.eventPayload
            );
            if (metadata?.commentId) {
                const commentSnapshot: PullRequestCommentSnapshot = {
                    ...metadata,
                    slackMessageId: response.ts,
                    slackThreadId: options.threadId
                };
                await COMMENTS_CACHE.set(
                    this.getCommentCacheKey(commentSnapshot.commentId),
                    commentSnapshot
                );
            }
        } else {
            const response = await this.client.chat.postMessage(request);
            const metadata = <PullrequestCommentSnapshotInSlackMetadata>(
                options.metadata?.eventPayload
            );
            if (metadata?.commentId) {
                const commentSnapshot: PullRequestCommentSnapshot = {
                    ...metadata,
                    slackMessageId: response.message.ts,
                    slackThreadId: response.message.thread_ts
                };
                await COMMENTS_CACHE.set(
                    this.getCommentCacheKey(commentSnapshot.commentId),
                    commentSnapshot
                );
            }
        }
    }
}
