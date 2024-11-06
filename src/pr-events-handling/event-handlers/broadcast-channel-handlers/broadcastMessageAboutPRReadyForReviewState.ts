import { PullRequestGenericEvent } from "../../event-contracts";

import { SlackBroadcastChannel } from "../../slack-api-ports";
import { italic, section } from "../utils/slack-building-blocks";
import { reviewPRAction } from "../utils";

export async function broadcastMessageAboutPRReadyForReviewState(payload: PullRequestGenericEvent, broadcastChannel: SlackBroadcastChannel) {
    const initialBroadcastMessageId = await broadcastChannel.findPROpenedBroadcastMessageId(payload.pullRequest.createdAt, {
        pullRequestId: payload.pullRequest.number.toString(),
        projectKey: payload.pullRequest.targetBranch.projectKey,
        repositorySlug: payload.pullRequest.targetBranch.repositoryName
    });
    if (!initialBroadcastMessageId) {
        return;
    }
    const messageTitle = `:sparkler: ${payload.actor.name} marked the pull request as ${italic("ready for review")}!`;

    await broadcastChannel.sendMessage({
        text: messageTitle,
        blocks: [section(messageTitle), reviewPRAction(payload.pullRequest)].filter(s => !!s),
        threadId: initialBroadcastMessageId
    });
}
