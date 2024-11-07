import { GitHubPullRequestCommentActionType, GitHubPullRequestCommentNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import { PullRequestCommentActionEvent } from "../../../../pr-events-handling/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import GitHubAPI from "../../../../api-adapters/github-api/GitHubAPI";

export async function transformPullRequestCommentPayload(notification: GitHubPullRequestCommentNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    const action = notification.action;

    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver, githubAPI)),
        eventKey: mapGitHubCommentActionToEventKey(action),
        comment: {
            id: notification.comment.id,
            replyToCommentId: notification.comment.in_reply_to_id,
            text: notification.comment.body,
            severity: "NORMAL",
            author: await mapGitHubUserToSlackUser(notification.comment.user, userIdResolver),
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