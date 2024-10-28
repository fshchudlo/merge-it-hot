import { PullRequestParticipantsUpdatedNotification } from "../../contracts";
import { WebhookPayloadHandler } from "../WebhookPayloadHandler";
import { SlackTargetedChannel } from "../../slack-api-ports";

export class PullRequestParticipantsChangedHandler implements WebhookPayloadHandler {
    public canHandle(payload: PullRequestParticipantsUpdatedNotification) {
        return payload.eventKey == "pr:participants:changed";
    }

    public async handle(payload: PullRequestParticipantsUpdatedNotification, slackChannel: SlackTargetedChannel) {
        await updateChannelMembers(payload, slackChannel);
    }
}

async function updateChannelMembers(payload: PullRequestParticipantsUpdatedNotification, slackChannel: SlackTargetedChannel) {
    const userIdsToAdd = payload.addedParticipants.map(payload => payload.slackUserId);

    if (userIdsToAdd.length > 0) {
        await slackChannel.inviteToChannel({
            users: userIdsToAdd,
            force: true
        });
    }

    const activeParticipants = [payload.pullRequest.author.name, ...payload.pullRequest.reviewers.map(r => r.user.name), ...payload.pullRequest.assignees.map(r => r.name)];
    const userIdsToRemove = payload.removedParticipants
        .filter(p => !activeParticipants.includes(p.name))
        .map(p => p.slackUserId);

    if (userIdsToRemove.length > 0) {
        await slackChannel.kickFromChannel({
            users: userIdsToRemove
        });
    }
}
