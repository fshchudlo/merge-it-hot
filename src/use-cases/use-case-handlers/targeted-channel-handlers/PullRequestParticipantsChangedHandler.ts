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
    const userIdsToRemove = payload.removedParticipants.map(payload => payload.slackUserId);

    if (userIdsToAdd.length > 0) {
        await slackChannel.inviteToChannel({
            users: userIdsToAdd,
            force: true
        });
    }

    await slackChannel.kickFromChannel({
        users: userIdsToRemove
    });
}
