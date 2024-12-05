import { PullRequestGenericEvent } from "../../event-contracts";

import { SlackBroadcastChannel } from "../../slack-api-ports";
import { italic, section } from "../../../slack-building-blocks";

export async function broadcastMessageAboutPRDraftStatusChange(
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
    let messageTitle;
    if (payload.eventKey === "pr:ready_for_review") {
        messageTitle = `:sparkler: ${payload.actor.name} marked the pull request as ${italic("ready for review")}`;
    } else {
        messageTitle = `:shushing_face: ${payload.actor.name} converted the pull request back to draft`;
    }
    await broadcastChannel.sendMessage({
        text: messageTitle,
        blocks: [section(messageTitle)],
        threadId: initialBroadcastMessageId,
    });
}
