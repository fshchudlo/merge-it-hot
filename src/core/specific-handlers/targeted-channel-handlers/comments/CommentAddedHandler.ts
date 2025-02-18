import { PullRequestCommentActionEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { buildCommentAddedMessage } from "./buildCommentAddedMessage";
import { SlackTargetedChannel } from "../../../ports/SlackTargetedChannel";
import shouldBeAddedAsParticipant from "../../internals/shouldBeAddedAsParticipant";

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

        if(shouldBeAddedAsParticipant(payload, payload.comment.author)) {
            await slackChannel.inviteToChannel(payload.comment.author.slackUserId);
        }
    }
}
