import { link, section, contextBlock, italic } from "../utils/slack-building-blocks";
import { snapshotPullRequestState } from "../utils";
import { PullRequestGenericEvent } from "../../event-contracts";
import { SendMessageArguments, SlackBroadcastChannel } from "../../slack-api-ports";

export async function broadcastMessageAboutOpenedPR(payload: PullRequestGenericEvent, broadcastChannel: SlackBroadcastChannel) {
    await broadcastChannel.sendMessage(buildMessage(payload));
}

function buildMessage(payload: PullRequestGenericEvent): SendMessageArguments {
    const prStateName = payload.pullRequest.isDraft? `${italic("draft")} pull request` : "pull request";

    const messageTitle = `:snowboarder: ${payload.actor.name} opened ${prStateName} "${payload.pullRequest.title}".`;

    const targetText = `Target: \`${payload.pullRequest.targetBranch.repositoryName}/${payload.pullRequest.targetBranch.branchName}\``;
    const participants = payload.pullRequest.participants.map(r => r.user.name);
    const reviewersContextBlock = participants.length == 0 ? null : contextBlock(`Assigned reviewers: ${participants.join(",")}.`);

    const invitationText = `You're welcome to ${link(payload.pullRequest.links.self, "join code review")}.`;

    return {
        text: messageTitle,
        blocks: [section(messageTitle), contextBlock(targetText), reviewersContextBlock, section(invitationText)]
            .filter(b => !!b),
        metadata: snapshotPullRequestState(payload)
    };
}
