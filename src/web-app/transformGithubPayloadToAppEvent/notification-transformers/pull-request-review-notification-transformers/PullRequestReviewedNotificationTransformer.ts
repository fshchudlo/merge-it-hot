import { PullRequestReviewState, PullRequestReviewSubmittedEvent } from "../../../../core/event-contracts";
import { GitHubPullRequestEventType, GitHubPullRequestReviewState, GitHubPullRequestReviewSubmittedNotification } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";

export class PullRequestReviewedNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType): boolean {
        return eventType == "pull_request_review";
    }

    async transform(
        payload: GitHubPullRequestReviewSubmittedNotification,
        userIdResolver: SlackUserIdResolver,
        githubAPI: GitHubAPI
    ): Promise<PullRequestReviewSubmittedEvent> {
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:review:submitted",
            review: {
                comment: payload.review.body || null,
                state: mapGitHubReviewState(payload.review.state)
            }
        };
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
