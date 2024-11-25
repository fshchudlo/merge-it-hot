import { PullRequestCommentActionEvent } from "../../../event-contracts";
import {
    markdownToSlackMarkup,
    snapshotCommentState,
    trimTextToSlackMessageLimits,
} from "../../utils";
import { link, quote, section } from "../../utils/slack-building-blocks";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import {
    PullRequestCommentSnapshot,
    SendMessageArguments,
    SlackTargetedChannel,
} from "../../../slack-api-ports";
import { buildCommentAddedMessage } from "./buildCommentAddedMessage";

export class CommentEditedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestCommentActionEvent) {
        return payload.eventKey == "pr:comment:edited";
    }

    async handle(
        payload: PullRequestCommentActionEvent,
        slackChannel: SlackTargetedChannel,
    ) {
        const commentSnapshot =
            await slackChannel.findLatestPullRequestCommentSnapshot(
                payload.comment.id,
            );
        const userAction = getCommentAction(payload, commentSnapshot);
        if (commentSnapshot && userAction.isTextOnlyChange) {
            const message = buildCommentAddedMessage(payload, commentSnapshot);
            await slackChannel.sendMessage({
                ...message,
                editMessageId: commentSnapshot.slackMessageId,
                replyBroadcast: undefined,
            });
        } else {
            const message = buildCommentChangedMessage(
                payload,
                commentSnapshot,
            );
            await slackChannel.sendMessage(message);
        }
    }
}

function buildCommentChangedMessage(
    payload: PullRequestCommentActionEvent,
    commentSnapshot: PullRequestCommentSnapshot,
): SendMessageArguments {
    const userAction = getCommentAction(payload, commentSnapshot);
    const messageTitle = `${userAction.emoji} ${payload.actor.name} ${link(payload.comment.link, userAction.title)}:`;
    const commentText = trimTextToSlackMessageLimits(
        quote(markdownToSlackMarkup(payload.comment.text)),
    );

    return {
        text: messageTitle,
        blocks: [section(messageTitle), section(commentText)],
        metadata: snapshotCommentState(payload),
        threadId:
            commentSnapshot?.slackThreadId || commentSnapshot?.slackMessageId,
        replyBroadcast: commentSnapshot ? true : undefined,
    };
}

function getCommentAction(
    payload: PullRequestCommentActionEvent,
    previousCommentSnapshot: PullRequestCommentSnapshot,
) {
    if (previousCommentSnapshot) {
        if (
            !previousCommentSnapshot.resolvedDate &&
            payload.comment.resolvedAt
        ) {
            return {
                title: `resolved thread`,
                emoji: ":white_check_mark:",
            };
        }
        if (
            previousCommentSnapshot.resolvedDate &&
            !payload.comment.resolvedAt
        ) {
            return {
                title: `reopened thread`,
                emoji: ":repeat:",
            };
        }
    }
    return {
        title: `edited comment`,
        isTextOnlyChange: true,
        emoji: ":writing_hand:",
    };
}
