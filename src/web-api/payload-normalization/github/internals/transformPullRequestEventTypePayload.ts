import { GitHubNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import GitHubAPI from "../../../../api-adapters/github-api/GitHubAPI";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import {
    PullRequestFromBranchUpdatedEvent,
    PullRequestGenericEvent,
    PullRequestModifiedEvent,
    PullRequestParticipantsUpdatedEvent
} from "../../../../pr-events-handling/event-contracts";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";

export async function transformPullRequestEventTypePayload(notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
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
                latestCommitMessage: await githubAPI.fetchCommitMessage(notification.pull_request.head.repo.owner.login, notification.pull_request.head.repo.name, notification.pull_request.head.sha),
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