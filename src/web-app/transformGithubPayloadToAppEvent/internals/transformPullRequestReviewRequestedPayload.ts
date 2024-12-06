import {
    GitHubPullRequestReviewersUpdatedNotification,
    GitHubUserPayload,
} from "../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import { PullRequestParticipantsUpdatedEvent } from "../../../core/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import { GitHubAPI } from "../ports/GitHubAPI";

export async function transformPullRequestReviewRequestedPayload(
    notification: GitHubPullRequestReviewersUpdatedNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
) {
    switch (notification.action) {
        case "review_requested":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:participants:changed",
                addedParticipants: await fetchParticipants(
                    notification,
                    userIdResolver,
                    githubAPI,
                ),
                removedParticipants: [],
            } as PullRequestParticipantsUpdatedEvent;
        case "review_request_removed":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:participants:changed",
                addedParticipants: [],
                removedParticipants: await fetchParticipants(
                    notification,
                    userIdResolver,
                    githubAPI,
                ),
            } as PullRequestParticipantsUpdatedEvent;
        default:
            throw new Error(`"${notification.action}" action key is unknown.`);
    }
}

async function fetchParticipants(
    notification: GitHubPullRequestReviewersUpdatedNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
) {
    if (notification.requested_team) {
        const teamMembers = await githubAPI.fetchFromAPIUrl<
            GitHubUserPayload[]
        >(notification.requested_team.members_url.replace("{/member}", ""));
        return Promise.all(
            teamMembers.map(
                async teamMember =>
                    await mapGitHubUserToSlackUser(teamMember, userIdResolver),
            ),
        );
    }
    if (notification.requested_reviewer) {
        return [
            await mapGitHubUserToSlackUser(
                notification.requested_reviewer,
                userIdResolver,
            ),
        ];
    }
    return [];
}
