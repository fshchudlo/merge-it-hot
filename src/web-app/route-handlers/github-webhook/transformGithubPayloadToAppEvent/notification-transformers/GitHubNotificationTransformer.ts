import { GitHubNotification, GitHubPullRequestEventType } from "../GitHubAPI.contracts";
import { PullRequestEvent } from "../../../../notification-handlers/event-contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { GitHubAPI } from "../ports/GitHubAPI";

export interface GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubNotification): boolean;

    transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestEvent>;
}