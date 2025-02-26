import {
    GitHubPullRequestCommentActionType,
    GitHubPullRequestCommentNotification
} from "../../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import {
    PullRequestCommentActionEvent, PullRequestCommentActionEventKey
} from "../../../../../notification-handlers/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import { GitHubAPI } from "../../ports/GitHubAPI";

export async function transformPullRequestCommentPayload(
    notification: GitHubPullRequestCommentNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI
): Promise<PullRequestCommentActionEvent> {
    const action = notification.action;
    return {
        ...(await mapPayloadGenericPart(
            notification,
            userIdResolver,
            githubAPI
        )),
        eventKey: mapGitHubCommentActionToEventKey(action),
        comment: {
            id: notification.comment.id,
            replyToCommentId: notification.comment.in_reply_to_id,
            text: notification.comment.body,
            author: await mapGitHubUserToSlackUser(
                notification.comment.user,
                userIdResolver
            ),
            resolvedAt: null,
            link: notification.comment.html_url
        },
        previousComment: notification.changes?.body?.from
    };
}

function mapGitHubCommentActionToEventKey(
    action: GitHubPullRequestCommentActionType
): PullRequestCommentActionEventKey {
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
