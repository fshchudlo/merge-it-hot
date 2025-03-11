import { GitHubNotification, GitHubPullRequestEventType } from "../GitHubAPI.contracts";
import { IgnoredEvent, PullRequestEvent } from "../../../../pr-notification-handlers/event-contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { GitHubAPI } from "../ports/GitHubAPI";

export interface GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubNotification): boolean;

    transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestEvent|IgnoredEvent>;
}
