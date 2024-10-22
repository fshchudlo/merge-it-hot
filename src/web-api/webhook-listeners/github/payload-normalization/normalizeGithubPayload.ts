import {
    PullRequestFromBranchUpdatedNotification,
    PullRequestGenericNotification,
    PullRequestNotification,
    PullRequestParticipantsUpdatedNotification,
    ReviewerPayload
} from "../../../../use-cases/contracts";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import GitHubAPI from "../../../../adapters/GitHubAPI";
import { GithubNotification } from "./GitHub.contracts";

export async function normalizeGithubPayload(notification: GithubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestNotification> {
    const eventKey = notification.action;
    switch (eventKey) {
        case "opened":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:opened"
            } as PullRequestGenericNotification;
        case "closed":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: notification.pull_request.merged ? "pr:merged" : "pr:deleted"
            } as PullRequestGenericNotification;
        case "review_requested":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [{
                    name: notification.requested_reviewer.login,
                    slackUserId: await getSlackUserId(userIdResolver, notification.requested_reviewer.login)
                }],
                removedParticipants: []
            } as PullRequestParticipantsUpdatedNotification;
        case "review_request_removed":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [],
                removedParticipants: [{
                    name: notification.requested_reviewer.login,
                    slackUserId: await getSlackUserId(userIdResolver, notification.requested_reviewer.login)
                }]
            } as PullRequestParticipantsUpdatedNotification;
        case "assigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [{
                    name: notification.assignee.login,
                    slackUserId: await getSlackUserId(userIdResolver, notification.assignee.login)
                }],
                removedParticipants: []
            } as PullRequestParticipantsUpdatedNotification;
        case "unassigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                removedParticipants: [{
                    name: notification.assignee.login,
                    slackUserId: await getSlackUserId(userIdResolver, notification.assignee.login)
                }],
                addedParticipants: []
            } as PullRequestParticipantsUpdatedNotification;
        case "synchronize":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:from_ref_updated",
                latestCommitMessage: githubAPI.canRead() ? await githubAPI.fetchCommitMessage(notification.pull_request.head.repo.owner.login, notification.pull_request.head.repo.name, notification.pull_request.head.sha) : null,
                latestCommitViewUrl: `${notification.pull_request.html_url}/commits/${notification.pull_request.head.sha}`
            } as PullRequestFromBranchUpdatedNotification;
        default:
            throw new Error(`"${eventKey}" action key is unknown.`);
    }
}

async function normalizePayloadGenericPart(payload: GithubNotification, userIdResolver: SlackUserIdResolver) {
    const normalizedReviewersPayload = await Promise.all(
        payload.pull_request.requested_reviewers.map(async reviewer => {
            return {
                user: {
                    name: reviewer.login,
                    slackUserId: await getSlackUserId(userIdResolver, reviewer.login)
                },
                status: "UNAPPROVED"
            } as ReviewerPayload;
        }));

    const basePayload: PullRequestGenericNotification = {
        eventKey: "pr:opened",
        actor: {
            name: formatUsername(payload.sender.login),
            slackUserId: await getSlackUserId(userIdResolver, payload.sender.login)
        },
        pullRequest: {
            number: +payload.number,
            title: payload.pull_request.title,
            description: payload.pull_request.body,
            createdAt: new Date(payload.pull_request.created_at),
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
            links: {
                self: payload.pull_request.html_url
            }
        }
    };
    return basePayload;
}

/*
* Gets the user login in the format "john-doe_company name" and returns "John Doe"
* */
function formatUsername(login: string) {
    const namePart = login.split("_")[0];

    const [firstName, lastName] = namePart.split("-");

    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    return `${formattedFirstName} ${formattedLastName}`;
}

/*
* Gets the user login in the format "john-doe_company name" and returns "john.doe@companyname.com"
* */
function getUserEmailFromGithubLogin(login: string): string {
    const [namePart, companyName] = login.split("_");

    const formattedName = namePart.replace("-", ".");

    return `${formattedName}@${companyName}.com`;
}

async function getSlackUserId(userIdResolver: SlackUserIdResolver, login: string): Promise<string> {
    const userId = await userIdResolver.getUserId(getUserEmailFromGithubLogin(login));
    if (!userId) {
        console.warn(`Could not find Slack user for the login ${login}`);
    }
    return userId;
}

