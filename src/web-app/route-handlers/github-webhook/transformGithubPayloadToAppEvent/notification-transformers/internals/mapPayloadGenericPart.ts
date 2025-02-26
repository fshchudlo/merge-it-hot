import { GitHubPullRequestNotificationBasicPayload, GitHubUserPayload } from "../../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { PullRequestGenericEvent, ParticipantPayload } from "../../../../../../notification-handlers/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import { GitHubAPI } from "../../ports/GitHubAPI";

export async function mapPayloadGenericPart(payload: GitHubPullRequestNotificationBasicPayload, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    const normalizedReviewersPayload = await fetchReviewersList(payload, userIdResolver, githubAPI);

    const normalizedAssigneesPayload = await Promise.all(
        payload.pull_request.assignees.map(async assignee => mapGitHubUserToSlackUser(assignee, userIdResolver))
    );

    const basePayload: PullRequestGenericEvent = {
        eventKey: "pr:opened",
        actor: await mapGitHubUserToSlackUser(payload.sender, userIdResolver),
        pullRequest: {
            number: payload.pull_request.number,
            title: payload.pull_request.title,
            description: payload.pull_request.body,
            createdAt: new Date(payload.pull_request.created_at),
            isDraft: payload.pull_request.draft,
            targetBranch: {
                branchName: payload.pull_request.base.ref,
                latestCommit: payload.pull_request.base.sha,
                repositoryName: payload.pull_request.base.repo.name,
                projectKey: payload.pull_request.base.repo.owner.login
            },
            fromBranch: {
                branchName: payload.pull_request.head.ref,
                latestCommit: payload.pull_request.head.sha,
                repositoryName: payload.pull_request.head.repo.name,
                projectKey: payload.pull_request.head.repo.owner.login
            },
            author: await mapGitHubUserToSlackUser(payload.pull_request.user, userIdResolver),
            participants: normalizedReviewersPayload,
            assignees: normalizedAssigneesPayload,
            links: {
                self: payload.pull_request.html_url
            }
        }
    };
    return basePayload;
}

async function fetchReviewersList(payload: GitHubPullRequestNotificationBasicPayload, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    const normalizedReviewersPayload = await Promise.all(
        payload.pull_request.requested_reviewers.map(async reviewer => {
            return {
                user: await mapGitHubUserToSlackUser(reviewer, userIdResolver)
            } as ParticipantPayload;
        })
    );

    for (const team of payload.pull_request.requested_teams) {
        const teamMembers = await githubAPI.fetchFromAPIUrl<GitHubUserPayload[]>(team.members_url.replace("{/member}", ""));
        const mappedUsers = await Promise.all(teamMembers.map(async teamMember => await mapGitHubUserToSlackUser(teamMember, userIdResolver)));
        normalizedReviewersPayload.push(...mappedUsers.map(user => ({ user })));
    }
    return normalizedReviewersPayload;
}
