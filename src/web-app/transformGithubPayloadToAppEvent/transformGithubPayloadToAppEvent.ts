import { IgnoredEvent, PullRequestEvent } from "../../core/event-contracts";
import { SlackUserIdResolver } from "./ports/SlackUserIdResolver";
import { GitHubNotification, GitHubPullRequestEventType } from "./GitHubAPI.contracts";
import { GitHubAPI } from "./ports/GitHubAPI";
import { GitHubNotificationTransformer } from "./notification-transformers/GitHubNotificationTransformer";
import * as transformers from "./notification-transformers";

const gitHubNotificationTransformers: Array<GitHubNotificationTransformer> = [
    new transformers.PullRequestOpenedNotificationTransformer(),
    new transformers.PullRequestClosedNotificationTransformer(),
    new transformers.PullRequestReopenedNotificationTransformer(),
    new transformers.PullRequestReadyForReviewNotificationTransformer(),
    new transformers.PullRequestConvertedToDraftNotificationTransformer(),
    new transformers.PullRequestReviewRequestNotificationTransformer(),
    new transformers.PullRequestAssignedNotificationTransformer(),
    new transformers.PullRequestUnassignedNotificationTransformer(),
    new transformers.PullRequestSynchronizedNotificationTransformer(),
    new transformers.PullRequestEditedNotificationTransformer(),

    new transformers.PullRequestReviewedNotificationTransformer(),
    new transformers.PullRequestCommentNotificationTransformer(),
    new transformers.PullRequestIssueCommentNotificationTransformer(),
    new transformers.PullRequestThreadCommentNotificationTransformer()
];

export async function transformGithubPayloadToAppEvent(
    eventType: GitHubPullRequestEventType,
    notification: GitHubNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI
): Promise<PullRequestEvent | IgnoredEvent> {
    for (const transformer of gitHubNotificationTransformers) {
        if (transformer.matches(eventType, notification)) {
            return await transformer.transform(notification, userIdResolver, githubAPI);
        }
    }
    throw new Error(`"${eventType}" event type is unknown.`);
}
