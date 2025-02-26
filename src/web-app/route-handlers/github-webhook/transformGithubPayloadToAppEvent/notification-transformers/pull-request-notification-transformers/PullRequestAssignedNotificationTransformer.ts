import { PullRequestParticipantsUpdatedEvent } from "../../../../../notification-handlers/event-contracts";
import { GitHubPullRequestAssigneesUpdatedNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";
import mapGitHubUserToSlackUser from "../internals/mapGitHubUserToSlackUser";

export class PullRequestAssignedNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubPullRequestAssigneesUpdatedNotification): boolean {
        return eventType == "pull_request" && payload.action == "assigned";
    }

    async transform(
        payload: GitHubPullRequestAssigneesUpdatedNotification,
        userIdResolver: SlackUserIdResolver,
        githubAPI: GitHubAPI
    ): Promise<PullRequestParticipantsUpdatedEvent> {
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:participants:changed",
            addedParticipants: [await mapGitHubUserToSlackUser(payload.assignee, userIdResolver)],
            removedParticipants: []
        };
    }
}
