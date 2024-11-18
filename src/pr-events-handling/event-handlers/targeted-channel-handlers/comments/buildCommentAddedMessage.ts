import { PullRequestCommentActionEvent } from "../../../event-contracts";
import { PullRequestCommentSnapshot, SendMessageArguments } from "../../../slack-api-ports";
import { formatAndTrimMarkdown, getTaskOrCommentTitle, snapshotCommentState } from "../../utils";
import { link, quote, section } from "../../utils/slack-building-blocks";

export function buildCommentAddedMessage(payload: PullRequestCommentActionEvent, parentCommentSnapshot: PullRequestCommentSnapshot): SendMessageArguments {
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