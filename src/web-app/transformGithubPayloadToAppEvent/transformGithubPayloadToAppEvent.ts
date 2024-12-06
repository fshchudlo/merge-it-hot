import {
    IgnoredEvent,
    PullRequestEvent,
} from "../../core/event-contracts";
import { SlackUserIdResolver } from "./ports/SlackUserIdResolver";
import {
    GitHubNotification,
    GitHubPullRequestCommentNotification,
    GitHubPullRequestEventType,
    GitHubPullRequestPayload,
    GitHubPullRequestReviewSubmittedNotification,
} from "./GitHubAPI.contracts";
import { transformPullRequestEventPayload } from "./internals/transformPullRequestEventPayload";
import { transformPullRequestCommentPayload } from "./internals/transformPullRequestCommentPayload";
import { transformPullRequestReviewThreadPayload } from "./internals/transformPullRequestReviewThreadPayload";
import { transformPullRequestReviewPayload } from "./internals/transformPullRequestReviewPayload";
import { GitHubAPI } from "./ports/GitHubAPI";

export async function transformGithubPayloadToAppEvent(
    eventType: GitHubPullRequestEventType,
    notification: GitHubNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
): Promise<PullRequestEvent | IgnoredEvent> {
    switch (eventType) {
        case "pull_request":
            return transformPullRequestEventPayload(
                notification,
                userIdResolver,
                githubAPI,
            );
        case "pull_request_review":
            return transformPullRequestReviewPayload(
                <GitHubPullRequestReviewSubmittedNotification>notification,
                userIdResolver,
                githubAPI,
            );
        case "pull_request_review_comment":
            return transformPullRequestCommentPayload(
                <GitHubPullRequestCommentNotification>notification,
                userIdResolver,
                githubAPI,
            );
        case "pull_request_review_thread":
            return transformPullRequestReviewThreadPayload(
                notification,
                userIdResolver,
                githubAPI,
            );
        case "issue_comment": {
            if (!(<any>notification).issue.pull_request) {
                // This is an issue comment, not PR comment
                return {
                    eventKey: "ignored_event",
                };
            }
            const pullRequest =
                await githubAPI.fetchFromAPIUrl<GitHubPullRequestPayload>(
                    (<any>notification).issue.pull_request.url,
                );
            notification = {
                ...notification,
                pull_request: pullRequest,
            };
            return transformPullRequestCommentPayload(
                <GitHubPullRequestCommentNotification>notification,
                userIdResolver,
                githubAPI,
            );
        }
        default:
            throw new Error(`"${eventType}" event type is unknown.`);
    }
}
