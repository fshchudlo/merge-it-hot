import { formatAndTrimMarkdown, getTaskOrCommentTitle, snapshotCommentState } from "../utils";
import { link, quote, section } from "../utils/slack-building-blocks";
import { PullRequestCommentActionEvent } from "../../event-contracts";
import { PullRequestEventHandler } from "../PullRequestEventHandler";
import { PullRequestCommentSnapshot, SendMessageArguments, SlackTargetedChannel } from "../../slack-api-ports";

export class CommentAddedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestCommentActionEvent) {
        return payload.eventKey == "pr:comment:added";
    }

    async handle(payload: PullRequestCommentActionEvent, slackChannel: SlackTargetedChannel) {
        const parentCommentSnapshot = payload.comment.replyToCommentId ? await slackChannel.findLatestPullRequestCommentSnapshot(payload.comment.replyToCommentId) : null;
        const message = buildSlackMessage(payload, parentCommentSnapshot);
        await slackChannel.sendMessage(message);
    }
}

function buildSlackMessage(payload: PullRequestCommentActionEvent, parentCommentSnapshot: PullRequestCommentSnapshot): SendMessageArguments {
    const action = parentCommentSnapshot ? "replied" : `added ${getTaskOrCommentTitle(payload)}`;
    const emoji = parentCommentSnapshot ? ":left_speech_bubble:" : `:loudspeaker:`;
    const messageTitle = `${emoji} ${payload.actor.name} ${link(payload.comment.link, action)}:`;
    const commentText = formatAndTrimMarkdown(payload.comment.text);

    return {
        text: messageTitle,
        blocks: [section(messageTitle), section(quote(commentText))],
        metadata: snapshotCommentState(payload),
        threadId: parentCommentSnapshot?.slackThreadId || parentCommentSnapshot?.slackMessageId,
        replyBroadcast: parentCommentSnapshot ? true : undefined
    };
}
