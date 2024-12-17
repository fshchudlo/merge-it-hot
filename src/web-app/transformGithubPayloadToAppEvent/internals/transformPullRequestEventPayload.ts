import { GitHubNotification } from "../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import {
    PullRequestFromBranchUpdatedEvent,
    PullRequestGenericEvent,
    IgnoredEvent,
    PullRequestModifiedEvent,
    PullRequestParticipantsUpdatedEvent,
    PullRequestEvent,
} from "../../../core/event-contracts";
import { transformPullRequestReviewRequestedPayload } from "./transformPullRequestReviewRequestedPayload";
import mapGitHubUserToSlackUser from "./mapGitHubUserToSlackUser";
import { GitHubAPI } from "../ports/GitHubAPI";

export async function transformPullRequestEventPayload(
    notification: GitHubNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
): Promise<PullRequestEvent | IgnoredEvent> {
    const action = notification.action;
    switch (action) {
        case "auto_merge_enabled":
        case "auto_merge_disabled":
        case "labeled":
        case "unlabeled":
        case "locked":
        case "unlocked":
        case "milestoned":
        case "demilestoned":
        case "dequeued":
        case "enqueued":
            return {
                eventKey: "ignored_event",
            };
        case "opened":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:opened",
            } as PullRequestGenericEvent;
        case "closed":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: notification.pull_request.merged
                    ? "pr:merged"
                    : "pr:deleted",
            } as PullRequestGenericEvent;
        case "reopened":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:reopened",
            } as PullRequestGenericEvent;
        case "ready_for_review":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:ready_for_review",
            } as PullRequestGenericEvent;
        case "converted_to_draft":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:converted_to_draft",
            } as PullRequestGenericEvent;
        case "review_requested":
        case "review_request_removed":
            return await transformPullRequestReviewRequestedPayload(
                notification,
                userIdResolver,
                githubAPI,
            );
        case "assigned":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:participants:changed",
                addedParticipants: [
                    await mapGitHubUserToSlackUser(
                        notification.assignee,
                        userIdResolver,
                    ),
                ],
                removedParticipants: [],
            } as PullRequestParticipantsUpdatedEvent;
        case "unassigned":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:participants:changed",
                removedParticipants: [
                    await mapGitHubUserToSlackUser(
                        notification.assignee,
                        userIdResolver,
                    ),
                ],
                addedParticipants: [],
            } as PullRequestParticipantsUpdatedEvent;
        case "synchronize":
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:from_ref_updated",
                latestCommitMessage: await githubAPI.fetchCommitMessage(
                    notification.pull_request.head.repo.owner.login,
                    notification.pull_request.head.repo.name,
                    notification.pull_request.head.sha,
                ),
                latestCommitViewUrl: `${notification.pull_request.html_url}/commits/${notification.pull_request.head.sha}`,
            } as PullRequestFromBranchUpdatedEvent;
        case "edited":
            if (notification.pull_request.state != "open" && notification.sender.type === "Bot") {
                return {
                    eventKey: "ignored_event"
                };
            }
            return {
                ...(await mapPayloadGenericPart(
                    notification,
                    userIdResolver,
                    githubAPI,
                )),
                eventKey: "pr:modified",
                previousDescription: notification.changes.body?.from,
                previousTitle: notification.changes.title?.from,
                previousTargetBranch: notification.changes.base
                    ? {
                          branchName: notification.changes.base.ref?.from,
                          latestCommit: notification.changes.base.sha?.from,
                      }
                    : null,
            } as PullRequestModifiedEvent;
        default:
            throw new Error(`"${action}" action key is unknown.`);
    }
}
