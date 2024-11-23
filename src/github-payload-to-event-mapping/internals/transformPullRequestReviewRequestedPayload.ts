import { GitHubPullRequestReviewersUpdatedNotification, GitHubUserPayload } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import { PullRequestParticipantsUpdatedEvent } from "../../event-handlers/event-contracts";
import GitHubAPI from "../../api-adapters/github-api/GitHubAPI";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";

export async function transformPullRequestReviewRequestedPayload(notification: GitHubPullRequestReviewersUpdatedNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    switch (notification.action) {
        case "review_requested":
            return {
                ...(await mapPayloadGenericPart(notification, userIdResolver, githubAPI)),
                eventKey: "pr:participants:changed",
                addedParticipants: await fetchParticipantsList(notification, userIdResolver, githubAPI),
                removedParticipants: []
            } as PullRequestParticipantsUpdatedEvent;
        case "review_request_removed":
            return {
                ...(await mapPayloadGenericPart(notification, userIdResolver, githubAPI)),
                eventKey: "pr:participants:changed",
                addedParticipants: [],
                removedParticipants: await fetchParticipantsList(notification, userIdResolver, githubAPI)
            } as PullRequestParticipantsUpdatedEvent;
        default:
            throw new Error(`"${notification.action}" action key is unknown.`);

    }
}

async function fetchParticipantsList(notification: GitHubPullRequestReviewersUpdatedNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    if (notification.requested_team) {
        const teamMembers = await githubAPI.fetchFromAPIUrl<GitHubUserPayload[]>(notification.requested_team.members_url.replace("{/member}", ""));
        return Promise.all(teamMembers.map(async teamMember => (await mapGitHubUserToSlackUser(teamMember, userIdResolver))));
    }
    if (notification.requested_reviewer) {
        return [await mapGitHubUserToSlackUser(notification.requested_reviewer, userIdResolver)];
    }
    return [];
}
