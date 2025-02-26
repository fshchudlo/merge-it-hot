import { PullRequestCommentActionEvent } from "../../../../../notification-handlers/event-contracts";
import { GitHubNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import mapGitHubUserToSlackUser from "../internals/mapGitHubUserToSlackUser";

export class PullRequestThreadCommentNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType): boolean {
        return eventType == "pull_request_review_thread";
    }

    async transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestCommentActionEvent> {
        if (payload.action !== "resolved" && payload.action !== "unresolved") {
            throw new Error(`"${payload.action}" review thread action key is unknown.`);
        }

        const rootComment = payload.thread.comments.find(comment => !comment.in_reply_to_id);
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:comment:edited",
            comment: {
                id: rootComment.id,
                replyToCommentId: rootComment.in_reply_to_id,
                text: rootComment.body,
                author: await mapGitHubUserToSlackUser(rootComment.user, userIdResolver),
                resolvedAt: payload.action == "resolved" ? new Date(rootComment.updated_at) : null,
                link: rootComment.html_url
            }
        };
    }
}
