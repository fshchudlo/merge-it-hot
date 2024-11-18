import { formatAndTrimMarkdown, getTaskOrCommentTitle, snapshotCommentState } from "../../utils";
import { quote, section } from "../../utils/slack-building-blocks";
import { PullRequestCommentActionEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SendMessageArguments, SlackTargetedChannel } from "../../../slack-api-ports";

export class CommentDeletedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestCommentActionEvent) {
        return payload.eventKey == "pr:comment:deleted";
    }

    async handle(payload: PullRequestCommentActionEvent, slackChannel: SlackTargetedChannel) {
        const previousCommentSnapshot = await slackChannel.findLatestPullRequestCommentSnapshot(payload.comment.id);

        if (previousCommentSnapshot) {
            await slackChannel.deleteMessage(previousCommentSnapshot.slackMessageId);
        } else {
            const message = buildSlackMessage(payload);
            await slackChannel.sendMessage(message);
        }
    }
}

function buildSlackMessage(payload: PullRequestCommentActionEvent): SendMessageArguments {
    const messageTitle = `:broom: ${payload.actor.name} deleted ${getTaskOrCommentTitle(payload)}:`;
    const commentText = formatAndTrimMarkdown(payload.comment.text);
    return {
        text: messageTitle,
        blocks: [section(messageTitle), section(quote(commentText))],
        metadata: snapshotCommentState(payload)
    };
}
