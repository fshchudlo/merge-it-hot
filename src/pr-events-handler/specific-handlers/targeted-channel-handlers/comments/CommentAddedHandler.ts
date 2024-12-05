import { PullRequestCommentActionEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../slack-api-ports";
import { buildCommentAddedMessage } from "./buildCommentAddedMessage";

export class CommentAddedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestCommentActionEvent) {
        return payload.eventKey == "pr:comment:added";
    }

    async handle(
        payload: PullRequestCommentActionEvent,
        slackChannel: SlackTargetedChannel,
    ) {
        const parentCommentSnapshot = payload.comment.replyToCommentId
            ? await slackChannel.findLatestPullRequestCommentSnapshot(
                  payload.comment.replyToCommentId,
              )
            : null;
        const message = buildCommentAddedMessage(
            payload,
            parentCommentSnapshot,
        );
        await slackChannel.sendMessage(message);
    }
}
