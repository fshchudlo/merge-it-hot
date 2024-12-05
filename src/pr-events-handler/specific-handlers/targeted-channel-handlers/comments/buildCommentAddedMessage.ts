import { PullRequestCommentActionEvent } from "../../../event-contracts";
import {
    PullRequestCommentSnapshot,
    SendMessageArguments,
} from "../../../slack-api-ports";
import {
    snapshotCommentState,
    markdownToSlackMarkup
} from "../../utils";
import { link, quote, section } from "../../../../slack-building-blocks";

export function buildCommentAddedMessage(
    payload: PullRequestCommentActionEvent,
    parentCommentSnapshot: PullRequestCommentSnapshot,
): SendMessageArguments {
    const action = parentCommentSnapshot ? "replied" : "added comment";
    const emoji = parentCommentSnapshot
        ? ":left_speech_bubble:"
        : `:loudspeaker:`;
    const messageTitle = `${emoji} ${payload.actor.name} ${link(payload.comment.link, action)}:`;
    const commentText = quote(markdownToSlackMarkup(payload.comment.text));

    return {
        text: messageTitle,
        blocks: [section(messageTitle), section(commentText)],
        metadata: snapshotCommentState(payload),
        threadId:
            parentCommentSnapshot?.slackThreadId ||
            parentCommentSnapshot?.slackMessageId,
        replyBroadcast: parentCommentSnapshot ? true : undefined,
    };
}
