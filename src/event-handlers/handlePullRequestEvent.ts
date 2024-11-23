import * as useCases from "./event-handlers";
import { PullRequestEvent } from "./event-contracts";

import { SlackBroadcastChannel, SlackTargetedChannel } from "./slack-api-ports";

const payloadHandlers = new Array<useCases.PullRequestEventHandler>(
    new useCases.PullRequestOpenedHandler(),
    new useCases.PullRequestDraftStatusChangedHandler(),
    new useCases.PullRequestModifiedHandler(),
    new useCases.PullRequestParticipantsChangedHandler(),
    new useCases.PullRequestReviewSubmittedHandler(),
    new useCases.CommentAddedHandler(),
    new useCases.CommentEditedHandler(),
    new useCases.CommentDeletedHandler(),
    new useCases.NewCommitAddedHandler(),
    new useCases.PullRequestCompletionHandler(),
    new useCases.PullRequestReopenedHandler()
);

export default async function handlePullRequestEvent(payload: PullRequestEvent, pullRequestChannel: SlackTargetedChannel, broadcastChannel: SlackBroadcastChannel = null) {
    const eventKey = payload.eventKey;
    for (const handler of payloadHandlers) {
        if (handler.canHandle(payload)) {
            await handler.handle(payload, pullRequestChannel);
        }
    }
    if (!broadcastChannel) {
        return;
    }
    switch (eventKey) {
        case "pr:opened":
            await useCases.broadcastMessageAboutOpenedPR(payload, broadcastChannel);
            break;
        case "pr:ready_for_review":
        case "pr:converted_to_draft":
            await useCases.broadcastMessageAboutPRDraftStatusChange(payload, broadcastChannel);
            break;
        case "pr:merged":
        case "pr:declined":
        case "pr:deleted":
            await useCases.broadcastMessageAboutClosedPR(payload, broadcastChannel);
            break;
        case "pr:reopened":
            await useCases.broadcastMessageAboutReopenedPR(payload, broadcastChannel);
            break;
    }
}

