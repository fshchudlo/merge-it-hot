import { PullRequestGenericEvent } from "../../event-contracts";
import { getPullRequestCompletionAction } from "../utils/getPullRequestCompletionAction";

import { SlackBroadcastChannel } from "../../slack-api-ports";

export async function broadcastMessageAboutClosedPR(
    payload: PullRequestGenericEvent,
    broadcastChannel: SlackBroadcastChannel,
) {
    const initialBroadcastMessageId =
        await broadcastChannel.findPROpenedBroadcastMessageId(
            payload.pullRequest.createdAt,
            {
                pullRequestId: payload.pullRequest.number.toString(),
                projectKey: payload.pullRequest.targetBranch.projectKey,
                repositorySlug: payload.pullRequest.targetBranch.repositoryName,
            },
        );
    if (!initialBroadcastMessageId) {
        return;
    }
    const completionAction = getPullRequestCompletionAction(payload);

    await broadcastChannel.sendMessage({
        text: `${completionAction.emoji} ${completionAction.text}`,
        threadId: initialBroadcastMessageId,
    });
    await broadcastChannel.addReaction(
        initialBroadcastMessageId,
        completionAction.reaction,
    );
}
