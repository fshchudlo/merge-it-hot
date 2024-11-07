import { GitHubNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import GitHubAPI from "../../../../api-adapters/github-api/GitHubAPI";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import {
    PullRequestFromBranchUpdatedEvent,
    PullRequestGenericEvent, PullRequestIgnoredEvent,
    PullRequestModifiedEvent,
    PullRequestParticipantsUpdatedEvent
} from "../../../../pr-events-handling/event-contracts";
import { transformPullRequestReviewRequestedPayload } from "./transformPullRequestReviewRequestedPayload";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";

export async function transformPullRequestEventTypePayload(notification: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    const action = notification.action;
    switch (action) {
        case "auto_merge_enabled":
        case "auto_merge_disabled":
            console.log(`Event ${notification.action} was configured to ignore.`);
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "ignored_event"
            } as PullRequestIgnoredEvent;
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
        case "reopened":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:reopened"
            } as PullRequestGenericEvent;
        case "ready_for_review":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:ready_for_review"
            } as PullRequestGenericEvent;
        case "converted_to_draft":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:converted_to_draft"
            } as PullRequestGenericEvent;
        case "review_requested":
        case "review_request_removed":
            return await transformPullRequestReviewRequestedPayload(notification, userIdResolver, githubAPI);
        case "assigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                addedParticipants: [await mapGitHubUserToSlackUser(notification.assignee, userIdResolver)],
                removedParticipants: []
            } as PullRequestParticipantsUpdatedEvent;
        case "unassigned":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:participants:changed",
                removedParticipants: [await mapGitHubUserToSlackUser(notification.assignee, userIdResolver)],
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