import { PullRequestParticipantsUpdatedEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../slack-api-ports";

export class PullRequestParticipantsChangedHandler implements PullRequestEventHandler {
    public canHandle(payload: PullRequestParticipantsUpdatedEvent) {
        return payload.eventKey == "pr:participants:changed";
    }

    public async handle(payload: PullRequestParticipantsUpdatedEvent, slackChannel: SlackTargetedChannel) {
        await updateChannelMembers(payload, slackChannel);
    }
}

async function updateChannelMembers(payload: PullRequestParticipantsUpdatedEvent, slackChannel: SlackTargetedChannel) {
    const userIdsToAdd = payload.addedParticipants.map(payload => payload.slackUserId);

    await slackChannel.inviteToChannel({
        users: userIdsToAdd,
        force: true
    });

    const activeParticipants = [payload.pullRequest.author.name, ...payload.pullRequest.participants.map(r => r.user.name), ...payload.pullRequest.assignees.map(r => r.name)];
    const userIdsToRemove = payload.removedParticipants
        .filter(p => !activeParticipants.includes(p.name))
        .map(p => p.slackUserId);

    if (userIdsToRemove.length > 0) {
        await slackChannel.kickFromChannel({
            users: userIdsToRemove
        });
    }
}
