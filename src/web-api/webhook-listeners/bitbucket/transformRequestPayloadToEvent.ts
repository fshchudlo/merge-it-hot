import BitbucketAPI from "../../../adapters/BitbucketAPI";
import {
    PullRequestCommentActionNotification,
    PullRequestFromBranchUpdatedNotification,
    PullRequestGenericNotification,
    PullRequestModifiedNotification,
    PullRequestNotification,
    PullRequestParticipantsUpdatedNotification, PullRequestReviewState,
    PullRequestReviewSubmittedNotification,
    UserPayload
} from "../../../use-cases/contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { BitbucketNotification, BitbucketUserPayload } from "./Bitbucket.contracts";

export async function transformRequestPayloadToEvent(notification: BitbucketNotification, bitbucketAPI: BitbucketAPI, userIdResolver: SlackUserIdResolver): Promise<PullRequestNotification> {
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
            return <PullRequestReviewSubmittedNotification>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey: "pr:review:submitted",
                review: {
                    comment: null,
                    state: mapEventKeyToReviewState(eventKey)
                }
            };
        case "pr:modified":
            return <PullRequestModifiedNotification>{
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
            return <PullRequestFromBranchUpdatedNotification>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                eventKey,
                latestCommitMessage: bitbucketAPI.canRead() ? await bitbucketAPI.fetchCommitMessage(notification.pullRequest.fromRef.repository.project.key, notification.pullRequest.fromRef.repository.slug, notification.pullRequest.fromRef.latestCommit) : null,
                latestCommitViewUrl: `${notification.pullRequest.links.self[0].href.replace("/overview", "")}/commits/${notification.pullRequest.fromRef.latestCommit}`
            };
        case "pr:reviewer:updated":
            return <PullRequestParticipantsUpdatedNotification>{
                ...(await normalizePayloadGenericPart(notification, userIdResolver)),
                "eventKey": "pr:participants:changed",
                addedParticipants: await normalizeUserPayloads(notification.addedReviewers, userIdResolver),
                removedParticipants: await normalizeUserPayloads(notification.removedReviewers, userIdResolver)
            };
        case "pr:comment:added":
        case "pr:comment:edited":
        case "pr:comment:deleted":
            return <PullRequestCommentActionNotification>{
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

async function normalizePayloadGenericPart(payload: BitbucketNotification, slackUserIdResolver: SlackUserIdResolver): Promise<PullRequestGenericNotification> {
    const normalizedReviewersPayload = await Promise.all(
        payload.pullRequest.reviewers.map(async reviewer => {
            return {
                user: await normalizeUserPayload(reviewer.user, slackUserIdResolver),
                status: reviewer.status
            };
        }));

    return <PullRequestGenericNotification>{
        eventKey: payload.eventKey,
        actor: {
            name: payload.actor.displayName,
            slackUserId: await slackUserIdResolver.getUserId(payload.actor.emailAddress)
        },
        pullRequest: {
            number: payload.pullRequest.id,
            title: payload.pullRequest.title,
            createdAt: new Date(payload.pullRequest.createdDate),
            author: {
                name: payload.pullRequest.author.user.displayName,
                slackUserId: await slackUserIdResolver.getUserId(payload.pullRequest.author.user.emailAddress)
            },
            description: payload.pullRequest.description,
            draft: false,
            links: {
                self: payload.pullRequest.links.self[0].href
            },
            reviewers: normalizedReviewersPayload,
            targetBranch: {
                branchName: payload.pullRequest.toRef.displayId,
                projectKey: payload.pullRequest.toRef.repository.project.key,
                repositoryName: payload.pullRequest.toRef.repository.slug,
                latestCommit: payload.pullRequest.toRef.latestCommit
            },
            fromBranch: {
                branchName: payload.pullRequest.fromRef.displayId,
                projectKey: payload.pullRequest.fromRef.repository.project.key,
                repositoryName: payload.pullRequest.fromRef.repository.slug,
                latestCommit: payload.pullRequest.fromRef.latestCommit
            }
        }
    };
}

async function normalizeUserPayloads(users: BitbucketUserPayload[], slackUserIdResolver: SlackUserIdResolver): Promise<UserPayload[]> {
    return await Promise.all(users.map(async (item) => await normalizeUserPayload(item, slackUserIdResolver)));
}

async function normalizeUserPayload(user: BitbucketUserPayload, slackUserIdResolver: SlackUserIdResolver): Promise<UserPayload> {
    const userId = await slackUserIdResolver.getUserId(user.emailAddress);
    return {
        name: user.displayName,
        slackUserId: userId
    };
}