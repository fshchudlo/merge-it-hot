import { PullRequestFromBranchUpdatedEvent } from "../../../../../../notification-handlers/event-contracts";
import { GitHubNotification, GitHubPullRequestEventType } from "../../GitHubAPI.contracts";
import { GitHubNotificationTransformer } from "../GitHubNotificationTransformer";
import { mapPayloadGenericPart } from "../internals/mapPayloadGenericPart";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubAPI } from "../../ports/GitHubAPI";

export class PullRequestSynchronizedNotificationTransformer implements GitHubNotificationTransformer {
    matches(eventType: GitHubPullRequestEventType, payload: GitHubNotification): boolean {
        return eventType == "pull_request" && payload.action == "synchronize";
    }

    async transform(payload: GitHubNotification, userIdResolver: SlackUserIdResolver, githubAPI: GitHubAPI): Promise<PullRequestFromBranchUpdatedEvent> {
        return {
            ...(await mapPayloadGenericPart(payload, userIdResolver, githubAPI)),
            eventKey: "pr:from_ref_updated",
            latestCommitMessage: await githubAPI.fetchCommitMessage(
                payload.pull_request.head.repo.owner.login,
                payload.pull_request.head.repo.name,
                payload.pull_request.head.sha
            ),
            latestCommitViewUrl: `${payload.pull_request.html_url}/commits/${payload.pull_request.head.sha}`
        } as PullRequestFromBranchUpdatedEvent;
    }
}
