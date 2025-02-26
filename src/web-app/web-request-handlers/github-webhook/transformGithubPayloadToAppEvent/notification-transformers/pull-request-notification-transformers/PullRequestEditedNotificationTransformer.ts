import { PullRequestModifiedEvent } from "../../../../../pr-notification-handlers/event-contracts";
import { GitHubPullRequestEditedNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";

export class PullRequestEditedNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubPullRequestEditedNotification): boolean {
        return eventType == "pull_request" && payload.action == "edited" && (payload.pull_request.state == "open" || payload.sender.type !== "Bot");
    }

    async transform(
        payload: GitHubPullRequestEditedNotification,
        userIdResolver: SlackUserIdResolver,
        githubAPI: GitHubAPI
    ): Promise<PullRequestModifiedEvent> {
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:modified",
            previousDescription: payload.changes.body?.from,
            previousTitle: payload.changes.title?.from,
            previousTargetBranch: payload.changes.base
                ? {
                      branchName: payload.changes.base.ref?.from,
                      latestCommit: payload.changes.base.sha?.from
                  }
                : null
        };
    }
}
