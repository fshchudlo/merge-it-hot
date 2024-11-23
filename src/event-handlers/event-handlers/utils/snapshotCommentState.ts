import { PullRequestCommentActionEvent } from "../../event-contracts";

import { PullrequestCommentSnapshotInSlackMetadata } from "../../slack-api-ports";

export const SNAPSHOT_COMMENT_STATE_EVENT_TYPE = "review_comment_snapshot_saved";

export function snapshotCommentState(payload: PullRequestCommentActionEvent) {
    return {
        eventType: SNAPSHOT_COMMENT_STATE_EVENT_TYPE,
        eventPayload: <PullrequestCommentSnapshotInSlackMetadata>{
            commentId: payload.comment.id.toString(),
            resolvedDate: payload.comment.resolvedAt?.getTime(),
            commentParentId: payload.comment.replyToCommentId?.toString()
        }
    };
}
