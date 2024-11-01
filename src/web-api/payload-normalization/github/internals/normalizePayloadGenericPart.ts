import { GitHubPullRequestNotificationBasicPayload } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";
import { PullRequestGenericEvent, ReviewerPayload, UserPayload } from "../../../../pr-events-handling/event-contracts";

export async function normalizePayloadGenericPart(payload: GitHubPullRequestNotificationBasicPayload, userIdResolver: SlackUserIdResolver) {

    const normalizedReviewersPayload = await Promise.all(
        payload.pull_request.requested_reviewers.map(async reviewer => {
            return {
                user: {
                    name: formatUsername(reviewer.login),
                    slackUserId: await getSlackUserId(userIdResolver, reviewer.login)
                }
            } as ReviewerPayload;
        }));

    const normalizedAssigneesPayload = await Promise.all(
        payload.pull_request.assignees.map(async assignee => {
            return {
                name: formatUsername(assignee.login),
                slackUserId: await getSlackUserId(userIdResolver, assignee.login)
            } as UserPayload;
        }));

    const basePayload: PullRequestGenericEvent = {
        eventKey: "pr:opened",
        actor: {
            name: formatUsername(payload.sender.login),
            slackUserId: await getSlackUserId(userIdResolver, payload.sender.login)
        },
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
            author: {
                name: formatUsername(payload.pull_request.user.login),
                slackUserId: await getSlackUserId(userIdResolver, payload.pull_request.user.login)
            },
            reviewers: normalizedReviewersPayload,
            assignees: normalizedAssigneesPayload,
            links: {
                self: payload.pull_request.html_url
            }
        }
    };
    return basePayload;
}