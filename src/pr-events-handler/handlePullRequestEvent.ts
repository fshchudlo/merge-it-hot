import * as useCases from "./event-handlers";
import { PullRequestEvent } from "./event-contracts";

import { SlackBroadcastChannel, SlackTargetedChannel } from "./slack-api-ports";

const payloadHandlers = new Array<useCases.PullRequestEventHandler>(
    new useCases.PullRequestOpenedHandler(),
    new useCases.PullRequestIsReadyForReviewHandler(),
    new useCases.PullRequestModifiedHandler(),
    new useCases.PullRequestParticipantsChangedHandler(),
    new useCases.PullRequestReviewSubmittedHandler(),
    new useCases.CommentAddedHandler(),
    new useCases.CommentEditedHandler(),
    new useCases.CommentDeletedHandler(),
    new useCases.NewCommitAddedHandler(),
    new useCases.PullRequestCompletionHandler()
);

export default async function handlePullRequestEvent(payload: PullRequestEvent, pullRequestChannel: SlackTargetedChannel, broadcastChannel: SlackBroadcastChannel = null) {
    const eventKey = payload.eventKey;
    for (const handler of payloadHandlers) {
        if (handler.canHandle(payload)) {
            await handler.handle(payload, pullRequestChannel);
        }
    }
    switch (eventKey) {
        case "pr:opened":
            await useCases.tryBroadcastMessageAboutOpenedPR(payload, broadcastChannel);
            break;
        case "pr:ready_for_review":
            await useCases.tryBroadcastMessageAboutPRReadyForReviewState(payload, broadcastChannel);
            break;
        case "pr:merged":
        case "pr:declined":
        case "pr:deleted":
            await useCases.tryBroadcastMessageAboutClosedPR(payload, broadcastChannel);
            break;
    }
}

