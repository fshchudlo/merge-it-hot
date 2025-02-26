import { PullRequestParticipantsUpdatedEvent } from "../../../../../pr-notification-handlers/event-contracts";
import { GitHubNotification, GitHubPullRequestEventType, GitHubPullRequestReviewersUpdatedNotification, GitHubUserPayload } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";
import mapGitHubUserToSlackUser from "../internals/mapGitHubUserToSlackUser";

export class PullRequestReviewRequestNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubNotification): boolean {
        return eventType == "pull_request" && ["review_requested", "review_request_removed"].includes(payload.action);
    }

    async transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestParticipantsUpdatedEvent> {
        switch (payload.action) {
            case "review_requested":
                return {
                    ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
                    eventKey: "pr:participants:changed",
                    addedParticipants: await fetchParticipants(payload, userIdResolver, githubAPI),
                    removedParticipants: []
                };
            case "review_request_removed":
                return {
                    ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
                    eventKey: "pr:participants:changed",
                    addedParticipants: [],
                    removedParticipants: await fetchParticipants(payload, userIdResolver, githubAPI)
                };
            default:
                throw new Error(`"${payload.action}" action key is unknown.`);
        }
    }
}

async function fetchParticipants(notification: GitHubPullRequestReviewersUpdatedNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    if (notification.requested_team) {
        const teamMembers = await githubAPI.fetchFromAPIUrl<GitHubUserPayload[]>(notification.requested_team.members_url.replace("{/member}", ""));
        return Promise.all(teamMembers.map(async teamMember => await mapGitHubUserToSlackUser(teamMember, userIdResolver)));
    }
    if (notification.requested_reviewer) {
        return [await mapGitHubUserToSlackUser(notification.requested_reviewer, userIdResolver)];
    }
    return [];
}
