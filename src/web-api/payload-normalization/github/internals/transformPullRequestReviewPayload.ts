import { GitHubPullRequestReviewState, GitHubPullRequestReviewSubmittedNotification } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { normalizePayloadGenericPart } from "./normalizePayloadGenericPart";
import { PullRequestReviewState, PullRequestReviewSubmittedEvent } from "../../../../pr-events-handling/event-contracts";
import GitHubAPI from "../../../../api-adapters/github-api/GitHubAPI";

export async function transformPullRequestReviewPayload(notification: GitHubPullRequestReviewSubmittedNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI) {
    return {
        ...(await normalizePayloadGenericPart(notification, userIdResolver, githubAPI)),
        eventKey: "pr:review:submitted",
        review: {
            comment: notification.review.body || null,
            state: mapGitHubReviewState(notification.review.state)
        }
    } as PullRequestReviewSubmittedEvent;
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
