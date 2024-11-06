import { GitHubPullRequestCommentActionType, GitHubPullRequestCommentNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";
import { PullRequestCommentActionEvent } from "../../../../pr-events-handling/event-contracts";

export async function transformPullRequestCommentPayload(notification: GitHubPullRequestCommentNotification, userIdResolver: SlackUserIdResolver) {
    const action = notification.action;

    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver)),
        eventKey: mapGitHubCommentActionToEventKey(action),
        comment: {
            id: notification.comment.id,
            replyToCommentId: notification.comment.in_reply_to_id,
            text: notification.comment.body,
            severity: "NORMAL",
            author: {
                name: formatUsername(notification.comment.user),
                slackUserId: await getSlackUserId(userIdResolver, notification.comment.user)
            },
            resolvedAt: null,
            threadResolvedAt: null,
            link: notification.comment.html_url
        },
        previousComment: notification.changes?.body?.from
    } as PullRequestCommentActionEvent;
}

function mapGitHubCommentActionToEventKey(action: GitHubPullRequestCommentActionType): string {
    switch (action) {
        case "created":
            return "pr:comment:added";
        case "edited":
            return "pr:comment:edited";
        case "deleted":
            return "pr:comment:deleted";
        default:
            throw new Error(`"${action}" comment action is unknown.`);
    }
}