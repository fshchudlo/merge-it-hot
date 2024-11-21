import BitbucketAPI from "../../../api-adapters/BitbucketAPI";
import {
    PullRequestCommentActionEvent,
    PullRequestEvent,
    PullRequestFromBranchUpdatedEvent,
    PullRequestModifiedEvent,
    PullRequestParticipantsUpdatedEvent,
    PullRequestReviewState,
    PullRequestReviewSubmittedEvent,
    UserPayload
} from "../../../pr-events-handling/event-contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import { BitbucketNotification, BitbucketUserPayload } from "./Bitbucket.contracts";
import { normalizePayloadGenericPart } from "./internals/normalizePayloadGenericPart";
import { normalizeUserPayload } from "./internals/normalizeUserPayload";

export async function transformRequestPayloadToEvent(notification: BitbucketNotification, bitbucketAPI: BitbucketAPI, userIdResolver: SlackUserIdResolver): Promise<PullRequestEvent> {
    const eventKey = notification.eventKey;
    switch (eventKey) {
        case "pr:opened":
        case "pr:merged":
        case "pr:declined":
        case "pr:deleted":
            return {
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey
            };
        case "pr:reviewer:approved":
        case "pr:reviewer:needs_work":
        case "pr:reviewer:unapproved":
            return <PullRequestReviewSubmittedEvent>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:review:submitted",
                review: {
                    comment: null,
                    state: mapEventKeyToReviewState(eventKey)
                }
            };
        case "pr:modified":
            return <PullRequestModifiedEvent>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey,
                previousTitle: notification.previousTitle,
                previousDescription: notification.previousDescription,
                previousTargetBranch: {
                    branchName: notification.previousTarget.displayId,
                    latestCommit: notification.previousTarget.latestCommit
                }
            };
        case "pr:from_ref_updated":
            return <PullRequestFromBranchUpdatedEvent>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey,
                latestCommitMessage: bitbucketAPI.canRead() ? await bitbucketAPI.fetchCommitMessage(notification.pullRequest.fromRef.repository.project.key, notification.pullRequest.fromRef.repository.slug, notification.pullRequest.fromRef.latestCommit) : null,
                latestCommitViewUrl: `${notification.pullRequest.links.self[0].href.replace("/overview", "")}/commits/${notification.pullRequest.fromRef.latestCommit}`
            };
        case "pr:reviewer:updated":
            return <PullRequestParticipantsUpdatedEvent>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                "eventKey": "pr:participants:changed",
                addedParticipants: await normalizeUserPayloads(notification.addedReviewers, userIdResolver),
                removedParticipants: await normalizeUserPayloads(notification.removedReviewers, userIdResolver)
            };
        case "pr:comment:added":
        case "pr:comment:edited":
        case "pr:comment:deleted":
            return <PullRequestCommentActionEvent>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey,
                replyToCommentId: notification.commentParentId,
                comment: {
                    id: notification.comment.id,
                    replyToCommentId: notification.commentParentId,
                    text: notification.comment.text,
                    severity: notification.comment.severity,
                    author: {
                        name: notification.comment.author.displayName,
                        isBotUser: false,
                        slackUserId: await userIdResolver.getUserId(notification.comment.author.emailAddress)
                    },
                    resolvedAt: notification.comment.resolvedDate ? new Date(notification.comment.resolvedDate) : null,
                    threadResolvedAt: notification.comment.threadResolvedDate ? new Date(notification.comment.threadResolvedDate) : null,
                    link: `${notification.pullRequest.links.self[0].href}?commentId=${notification.comment.id}`
                },
                previousComment: notification.previousComment
            };
        default:
            throw new Error(`"${eventKey}" event key is unknown.`);
    }
}

function mapEventKeyToReviewState(eventKey: "pr:reviewer:approved" | "pr:reviewer:needs_work" | "pr:reviewer:unapproved"): PullRequestReviewState {
    switch (eventKey) {
        case "pr:reviewer:approved":
            return "APPROVED";
        case "pr:reviewer:needs_work":
            return "CHANGES_REQUESTED";
        case "pr:reviewer:unapproved":
            return "DISMISSED";
        default:
            throw new Error(`"${eventKey}" event key is unknown.`);
    }
}

async function normalizeUserPayloads(users: BitbucketUserPayload[], slackUserIdResolver: SlackUserIdResolver): Promise<UserPayload[]> {
    return await Promise.all(users.map(async (item) => await normalizeUserPayload(item, slackUserIdResolver)));
}
