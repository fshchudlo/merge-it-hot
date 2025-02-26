import { PullRequestGenericEvent } from "../../../../../notification-handlers/event-contracts";
import { GitHubNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";

export class PullRequestReadyForReviewNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubNotification): boolean {
        return eventType == "pull_request" && payload.action == "ready_for_review";
    }

    async transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestGenericEvent> {
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:ready_for_review"
        };
    }
}
