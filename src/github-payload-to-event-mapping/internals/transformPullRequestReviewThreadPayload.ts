import { GitHubNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import { PullRequestCommentActionEvent } from "../../pr-events-handler/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import GitHubAPI from "../../api-adapters/github-api/GitHubAPI";

export async function transformPullRequestReviewThreadPayload(
    notification: GitHubNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
) {
    if (
        notification.action !== "resolved" &&
        notification.action !== "unresolved"
    ) {
        throw new Error(
            `"${notification.action}" review thread action key is unknown.`,
        );
    }

    const rootComment = notification.thread.comments.find(
        comment => !comment.in_reply_to_id,
    );
    return {
        ...(await mapPayloadGenericPart(
            notification,
            userIdResolver,
            githubAPI,
        )),
        eventKey: "pr:comment:edited",
        comment: {
            id: rootComment.id,
            replyToCommentId: rootComment.in_reply_to_id,
            text: rootComment.body,
            author: await mapGitHubUserToSlackUser(
                rootComment.user,
                userIdResolver,
            ),
            resolvedAt:
                notification.action == "resolved"
                    ? new Date(rootComment.updated_at)
                    : null,
            link: rootComment.html_url,
        },
    } as PullRequestCommentActionEvent;
}
