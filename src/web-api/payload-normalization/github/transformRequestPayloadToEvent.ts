import { PullRequestEvent } from "../../../pr-events-handling/event-contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import GitHubAPI from "../../../api-adapters/GitHubAPI";
import {
    GitHubNotification,
    GitHubPullRequestCommentNotification,
    GitHubPullRequestEventType,
    GitHubPullRequestPayload,
    GitHubPullRequestReviewSubmittedNotification
} from "./GitHub.contracts";
import { transformPullRequestEventTypePayload } from "./internals/transformPullRequestEventTypePayload";
import { transformPullRequestCommentPayload } from "./internals/transformPullRequestCommentPayload";
import { transformPullRequestReviewThreadPayload } from "./internals/transformPullRequestReviewThreadPayload";
import { transformPullRequestReviewPayload } from "./internals/transformPullRequestReviewPayload";

export async function transformRequestPayloadToEvent(eventType: GitHubPullRequestEventType | GitHubPullRequestCommentNotification, notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestEvent> {
    switch (eventType) {
        case "pull_request":
            return await transformPullRequestEventTypePayload(notification, userIdResolver, githubAPI);
        case "pull_request_review":
            return await transformPullRequestReviewPayload(<GitHubPullRequestReviewSubmittedNotification>notification, userIdResolver);
        case "pull_request_review_comment":
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver);
        case "pull_request_review_thread":
            return await transformPullRequestReviewThreadPayload(notification, userIdResolver);
        case "issue_comment":
            if (!githubAPI.canRead()) {
                throw new Error("Cannot fetch pull request details for the 'issue_comment.created' event without read access to GitHub API");
            }
            const pullRequest = await githubAPI.fetchFromAPIUrl<GitHubPullRequestPayload>((<any>notification).issue.pull_request.url);
            notification = {
                ...notification,
                pull_request: pullRequest
            };
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver);
        default:
            throw new Error(`"${eventType}" event type is unknown.`);
    }
}