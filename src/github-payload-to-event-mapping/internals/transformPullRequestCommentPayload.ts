import {
    GitHubPullRequestCommentActionType,
    GitHubPullRequestCommentNotification
} from "../GitHub.contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import {
    PullRequestCommentActionEvent,
    IgnoredEvent
} from "../../pr-events-handler/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import { GitHubAPI } from "../GitHubAPI.port";

export async function transformPullRequestCommentPayload(
    notification: GitHubPullRequestCommentNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI
): Promise<PullRequestCommentActionEvent | IgnoredEvent> {
    const action = notification.action;

    if (notification.pull_request.state != "open" && notification.sender.type === "Bot") {
        return {
            eventKey: "ignored_event"
        };
    }

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
    } as PullRequestCommentActionEvent;
}

function mapGitHubCommentActionToEventKey(
    action: GitHubPullRequestCommentActionType
): string {
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
