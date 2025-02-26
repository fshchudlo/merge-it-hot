import { PullRequestCommentActionEvent } from "../../../../core/event-contracts";
import { GitHubPullRequestCommentNotification, GitHubPullRequestEventType, GitHubPullRequestPayload } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";
import { transformPullRequestCommentPayload } from "../internals/transformPullRequestCommentPayload";

export class PullRequestIssueCommentNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubPullRequestCommentNotification): boolean {
        // On GitHub PR is also an issue. Filter out "real" issue comments keeping only PR comments
        return eventType == "issue_comment" && !!(<any>payload).issue.pull_request;
    }

    async transform(
        payload: GitHubPullRequestCommentNotification,
        userIdResolver: SlackUserIdResolver,
        githubAPI: GitHubAPI
    ): Promise<PullRequestCommentActionEvent> {
        const pullRequest = await githubAPI.fetchFromAPIUrl<GitHubPullRequestPayload>((<any>payload).issue.pull_request.url);
        payload = {
            ...payload,
            pull_request: pullRequest
        };
        return await transformPullRequestCommentPayload(payload, userIdResolver, githubAPI);
    }
}
