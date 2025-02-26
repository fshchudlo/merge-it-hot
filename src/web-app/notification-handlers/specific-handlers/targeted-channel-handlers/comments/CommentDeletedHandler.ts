import { snapshotCommentState, markdownToSlackMarkup } from "../../internals";
import { quote, section } from "@slack-building-blocks";
import { PullRequestCommentActionEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../../ports/SendMessageArguments";

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
    const messageTitle = `:broom: ${payload.actor.name} deleted comment:`;
    const commentText = quote(markdownToSlackMarkup(payload.comment.text));
    return {
        text: messageTitle,
        blocks: [section(messageTitle), section(commentText)],
        metadata: snapshotCommentState(payload)
    };
}
