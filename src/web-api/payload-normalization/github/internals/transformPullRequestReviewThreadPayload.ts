import { GitHubNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";
import { PullRequestCommentActionEvent } from "../../../../pr-events-handling/event-contracts";

export async function transformPullRequestReviewThreadPayload(notification: GitHubNotification, userIdResolver: SlackUserIdResolver) {
    if (notification.action !== "resolved" && notification.action !== "unresolved") {
        throw new Error(`"${notification.action}" review thread action key is unknown.`);
    }

    const rootComment = notification.thread.comments.find(comment => !comment.in_reply_to_id);
    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver)),
        eventKey: "pr:comment:edited",
        comment: {
            id: rootComment.id,
            replyToCommentId: rootComment.in_reply_to_id,
            text: rootComment.body,
            severity: "NORMAL",
            author: {
                name: formatUsername(rootComment.user),
                slackUserId: await getSlackUserId(userIdResolver, rootComment.user)
            },
            resolvedAt: null,
            threadResolvedAt: notification.action == "resolved" ? new Date(rootComment.updated_at) : null,
            link: rootComment.html_url
        }
    } as PullRequestCommentActionEvent;
}