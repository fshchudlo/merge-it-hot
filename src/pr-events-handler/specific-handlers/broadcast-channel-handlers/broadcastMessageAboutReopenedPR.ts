import { PullRequestGenericEvent } from "../../event-contracts";
import { SlackBroadcastChannel } from "../../slack-api-ports";
import { link, section } from "../../../slack-building-blocks";
import { reviewPRAction } from "../utils";

export async function broadcastMessageAboutReopenedPR(
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
    const messageTitle = `:recycle: ${payload.actor.name} reopened ${link(payload.pullRequest.links.self, "pull request")}`;

    await broadcastChannel.sendMessage({
        text: messageTitle,
        blocks: [section(messageTitle), reviewPRAction(payload.pullRequest)],
        threadId: initialBroadcastMessageId,
    });
    await broadcastChannel.addReaction(initialBroadcastMessageId, "recycle");
}
