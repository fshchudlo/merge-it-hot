import { GitHubPullRequestNotificationBasicPayload } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { PullRequestGenericEvent, ParticipantPayload } from "../../../../pr-events-handling/event-contracts";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";

export async function normalizePayloadGenericPart(payload: GitHubPullRequestNotificationBasicPayload, userIdResolver: SlackUserIdResolver) {

    const normalizedReviewersPayload = await Promise.all(
        payload.pull_request.requested_reviewers.map(async reviewer => {
            return {
                user: await mapGitHubUserToSlackUser(reviewer, userIdResolver)
            } as ParticipantPayload;
        }));

    const normalizedAssigneesPayload = await Promise.all(
        payload.pull_request.assignees.map(async assignee => mapGitHubUserToSlackUser(assignee, userIdResolver)));

    const basePayload: PullRequestGenericEvent = {
        eventKey: "pr:opened",
        actor: await mapGitHubUserToSlackUser(payload.sender, userIdResolver),
        pullRequest: {
            number: payload.pull_request.number,
            title: payload.pull_request.title,
            description: payload.pull_request.body,
            createdAt: new Date(payload.pull_request.created_at),
            draft: payload.pull_request.draft,
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