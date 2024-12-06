import {
    GitHubPullRequestReviewState,
    GitHubPullRequestReviewSubmittedNotification,
} from "../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";
import { mapPayloadGenericPart } from "./mapPayloadGenericPart";
import {
    PullRequestReviewState,
    PullRequestReviewSubmittedEvent,
} from "../../../core/event-contracts";
import { GitHubAPI } from "../ports/GitHubAPI";

export async function transformPullRequestReviewPayload(
    notification: GitHubPullRequestReviewSubmittedNotification,
    userIdResolver: SlackUserIdResolver,
    githubAPI: GitHubAPI,
) {
    return {
        ...(await mapPayloadGenericPart(
            notification,
            userIdResolver,
            githubAPI,
        )),
        eventKey: "pr:review:submitted",
        review: {
            comment: notification.review.body || null,
            state: mapGitHubReviewState(notification.review.state),
        },
    } as PullRequestReviewSubmittedEvent;
}
function mapGitHubReviewState(
    state: GitHubPullRequestReviewState,
): PullRequestReviewState {
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
