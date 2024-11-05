import { BitbucketNotification } from "../Bitbucket.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { PullRequestGenericEvent } from "../../../../pr-events-handling/event-contracts";
import { normalizeUserPayload } from "./normalizeUserPayload";

export async function normalizePayloadGenericPart(payload: BitbucketNotification, slackUserIdResolver: SlackUserIdResolver): Promise<PullRequestGenericEvent> {
    const normalizedReviewersPayload = await Promise.all(
        payload.pullRequest.reviewers.map(async reviewer => {
            return {
                user: await normalizeUserPayload(reviewer.user, slackUserIdResolver),
                status: reviewer.status
            };
        }));

    return <PullRequestGenericEvent>{
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
            participants: normalizedReviewersPayload,
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
