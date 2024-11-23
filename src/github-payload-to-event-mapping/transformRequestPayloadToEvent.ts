import { IgnoredEvent, PullRequestEvent } from "../event-handlers/event-contracts";
import { SlackUserIdResolver } from "./SlackUserIdResolver";
import GitHubAPI from "../api-adapters/github-api/GitHubAPI";
import {
    GitHubNotification,
    GitHubPullRequestCommentNotification,
    GitHubPullRequestEventType,
    GitHubPullRequestPayload,
    GitHubPullRequestReviewSubmittedNotification
} from "./GitHub.contracts";
import { transformPullRequestEventPayload } from "./internals/transformPullRequestEventPayload";
import { transformPullRequestCommentPayload } from "./internals/transformPullRequestCommentPayload";
import { transformPullRequestReviewThreadPayload } from "./internals/transformPullRequestReviewThreadPayload";
import { transformPullRequestReviewPayload } from "./internals/transformPullRequestReviewPayload";

export async function transformRequestPayloadToEvent(eventType: GitHubPullRequestEventType, notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestEvent | IgnoredEvent> {
    switch (eventType) {
        case "pull_request":
            return await transformPullRequestEventPayload(notification, userIdResolver, githubAPI);
        case "pull_request_review":
            return await transformPullRequestReviewPayload(<GitHubPullRequestReviewSubmittedNotification>notification, userIdResolver, githubAPI);
        case "pull_request_review_comment":
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver, githubAPI);
        case "pull_request_review_thread":
            return await transformPullRequestReviewThreadPayload(notification, userIdResolver, githubAPI);
        case "issue_comment":
            if (!(<any>notification).issue.pull_request) {
                // This is an issue comment, not PR comment
                return {
                    eventKey: "ignored_event"
                };
            }
            const pullRequest = await githubAPI.fetchFromAPIUrl<GitHubPullRequestPayload>((<any>notification).issue.pull_request.url);
            notification = {
                ...notification,
                pull_request: pullRequest
            };
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver, githubAPI);
        default:
            throw new Error(`"${eventType}" event type is unknown.`);
    }
}