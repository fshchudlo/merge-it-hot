import { PullRequestCommentActionEvent } from "../../../../../../notification-handlers/event-contracts";
import { GitHubPullRequestCommentNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";
import { transformPullRequestCommentPayload } from "../internals/transformPullRequestCommentPayload";

export class PullRequestCommentNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubPullRequestCommentNotification): boolean {
        return eventType == "pull_request_review_comment" && (payload.pull_request.state == "open" || payload.sender.type !== "Bot");
    }

    async transform(
        payload: GitHubPullRequestCommentNotification,
        userIdResolver: SlackUserIdResolver,
        githubAPI: GitHubAPI
    ): Promise<PullRequestCommentActionEvent> {
        return await transformPullRequestCommentPayload(payload, userIdResolver, githubAPI);
    }
}
