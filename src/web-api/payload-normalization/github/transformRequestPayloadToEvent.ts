import {
    PullRequestCommentActionEvent,
    PullRequestFromBranchUpdatedEvent,
    PullRequestGenericEvent, PullRequestModifiedEvent,
    PullRequestEvent,
    PullRequestParticipantsUpdatedEvent, PullRequestReviewState, PullRequestReviewSubmittedEvent,
    ReviewerPayload, UserPayload
} from "../../../pr-events-handling/event-contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import GitHubAPI from "../../../api-adapters/GitHubAPI";
import {
    GitHubNotification,
    GitHubPullRequestCommentActionType, GitHubPullRequestCommentNotification, GitHubPullRequestEventType, GitHubPullRequestNotificationBasicPayload, GitHubPullRequestPayload,
    GitHubPullRequestReviewState, GitHubPullRequestReviewSubmittedNotification
} from "./GitHub.contracts";

export async function transformRequestPayloadToEvent(eventType: GitHubPullRequestEventType | GitHubPullRequestCommentNotification, notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestEvent> {
    switch (eventType) {
        case "pull_request":
            return await transformPullRequestPayload(notification, userIdResolver, githubAPI);
        case "pull_request_review":
            return await transformPullRequestReviewPayload(<GitHubPullRequestReviewSubmittedNotification>notification, userIdResolver);
        case "pull_request_review_comment":
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver);
        case "pull_request_review_thread":
            return await transformPullRequestReviewThreadPayload(notification, userIdResolver);
        case "issue_comment":
            if (!githubAPI.canRead()) {
                throw new Error("Cannot fetch pull request details for the 'issue_comment.created' event without read access to GitHub API");
            }
            const pullRequest = await githubAPI.fetchFromAPIUrl<GitHubPullRequestPayload>((<any>notification).issue.pull_request.url);
            notification = {
                ...notification,
                pull_request: pullRequest
            };
            return await transformPullRequestCommentPayload(<GitHubPullRequestCommentNotification>notification, userIdResolver);
        default:
            throw new Error(`"${eventType}" event type is unknown.`);
    }


}

async function transformPullRequestReviewThreadPayload(notification: GitHubNotification, userIdResolver: SlackUserIdResolver) {
    if (notification.action !== "resolved" && notification.action !== "unresolved") {
        throw new Error(`"${notification.action}" review thread action key is unknown.`);
    }

    const rootComment = notification.thread.comments.find(comment => !comment.in_reply_to_id);
    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver)),
        eventKey: "pr:comment:edited",
        comment: {
            id: rootComment.id,
            replyToCommentId: rootComment.in_reply_to_id,
            text: rootComment.body,
            severity: "NORMAL",
            author: {
                name: formatUsername(rootComment.user.login),
                slackUserId: await getSlackUserId(userIdResolver, rootComment.user.login)
            },
            resolvedAt: null,
            threadResolvedAt: notification.action == "resolved" ? new Date(rootComment.updated_at) : null,
            link: rootComment.html_url
        }
    } as PullRequestCommentActionEvent;
}

async function transformPullRequestReviewPayload(notification: GitHubPullRequestReviewSubmittedNotification, userIdResolver: SlackUserIdResolver) {
    if (notification.action !== "submitted") {
        throw new Error(`"${notification.action}" review action key is unknown.`);
    }
    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver)),
        eventKey: "pr:review:submitted",
        review: {
            comment: notification.review.body || null,
            state: mapGitHubReviewState(notification.review.state)
        }
    } as PullRequestReviewSubmittedEvent;
}

async function transformPullRequestCommentPayload(notification: GitHubPullRequestCommentNotification, userIdResolver: SlackUserIdResolver) {
    const action = notification.action;

    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver)),
        eventKey: mapGitHubCommentActionToEventKey(action),
        comment: {
            id: notification.comment.id,
            replyToCommentId: notification.comment.in_reply_to_id,
            text: notification.comment.body,
            severity: "NORMAL",
            author: {
                name: formatUsername(notification.comment.user.login),
                slackUserId: await getSlackUserId(userIdResolver, notification.comment.user.login)
            },
            resolvedAt: null,
            threadResolvedAt: null,
            link: notification.comment.html_url
        },
        previousComment: notification.changes?.body?.from
    } as PullRequestCommentActionEvent;
}

async function transformPullRequestPayload(notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    const action = notification.action;
    switch (action) {
        case "opened":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:opened"
            } as PullRequestGenericEvent;
        case "closed":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: notification.pull_request.merged ? "pr:merged" : "pr:deleted"
            } as PullRequestGenericEvent;
        case "ready_for_review":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:ready_for_review"
            } as PullRequestGenericEvent;
        case "review_requested":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [{
                    name: formatUsername(notification.requested_reviewer.login),
                    slackUserId: await getSlackUserId(userIdResolver, notification.requested_reviewer.login)
                }],
                removedParticipants: []
            } as PullRequestParticipantsUpdatedEvent;
        case "review_request_removed":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [],
                removedParticipants: [{
                    name: formatUsername(notification.requested_reviewer.login),
                    slackUserId: await getSlackUserId(userIdResolver, notification.requested_reviewer.login)
                }]
            } as PullRequestParticipantsUpdatedEvent;
        case "assigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [{
                    name: formatUsername(notification.assignee.login),
                    slackUserId: await getSlackUserId(userIdResolver, notification.assignee.login)
                }],
                removedParticipants: []
            } as PullRequestParticipantsUpdatedEvent;
        case "unassigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                removedParticipants: [{
                    name: formatUsername(notification.assignee.login),
                    slackUserId: await getSlackUserId(userIdResolver, notification.assignee.login)
                }],
                addedParticipants: []
            } as PullRequestParticipantsUpdatedEvent;
        case "synchronize":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:from_ref_updated",
                latestCommitMessage: githubAPI.canRead() ? await githubAPI.fetchCommitMessage(notification.pull_request.head.repo.owner.login, notification.pull_request.head.repo.name, notification.pull_request.head.sha) : null,
                latestCommitViewUrl: `${notification.pull_request.html_url}/commits/${notification.pull_request.head.sha}`
            } as PullRequestFromBranchUpdatedEvent;
        case "edited":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:modified",
                previousDescription: notification.changes.body?.from,
                previousTitle: notification.changes.title?.from,
                previousTargetBranch: notification.changes.base ? {
                    branchName: notification.changes.base.ref?.from,
                    latestCommit: notification.changes.base.sha?.from
                } : null
            } as PullRequestModifiedEvent;
        default:
            throw new Error(`"${action}" action key is unknown.`);
    }

}

function mapGitHubCommentActionToEventKey(action: GitHubPullRequestCommentActionType): string {
    switch (action) {
        case "created":
            return "pr:comment:added";
        case "edited":
            return "pr:comment:edited";
        case "deleted":
            return "pr:comment:deleted";
        default:
            throw new Error(`"${action}" comment action is unknown.`);
    }
}


function mapGitHubReviewState(state: GitHubPullRequestReviewState): PullRequestReviewState {
    switch (state) {
        case "approved":
            return "APPROVED";
        case "changes_requested":
            return "CHANGES_REQUESTED";
        case "commented":
            return "COMMENTED";
        case "dismissed":
            return "DISMISSED";
        default:
            throw new Error(`"${state}" review state is unknown.`);
    }
}

async function normalizePayloadGenericPart(payload: GitHubPullRequestNotificationBasicPayload, userIdResolver: SlackUserIdResolver) {

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
function getUserEmailFromGitHubLogin(login: string): string {
    const [namePart, companyName] = login.split("_");

    const formattedName = namePart.replace("-", ".");

    return `${formattedName}@${companyName}.com`;
}

async function getSlackUserId(userIdResolver: SlackUserIdResolver, login: string): Promise<string> {
    const userId = await userIdResolver.getUserId(getUserEmailFromGitHubLogin(login));
    if (!userId) {
        console.warn(`Could not find Slack user for the login ${login}`);
    }
    return userId;
}

