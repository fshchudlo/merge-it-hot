import { italic, section } from "../utils/slack-building-blocks";
import { reviewPRAction } from "../utils";
import { PullRequestGenericNotification } from "../../contracts";
import { WebhookPayloadHandler } from "../WebhookPayloadHandler";
import { SendMessageArguments, SlackTargetedChannel } from "../../slack-api-ports";

export class PullRequestIsReadyForReviewHandler implements WebhookPayloadHandler {
    canHandle(payload: PullRequestGenericNotification) {
        return payload.eventKey == "pr:ready_for_review";
    }

    async handle(payload: PullRequestGenericNotification, slackChannel: SlackTargetedChannel) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
    }
}

function buildSlackMessage(payload: PullRequestGenericNotification): SendMessageArguments {
    const messageTitle = `:sparkler: ${payload.actor.name} marked the pull request as ${italic("ready for review")}!`;

    return {
        text: messageTitle,
        blocks: [section(messageTitle), reviewPRAction(payload.pullRequest)].filter(s => !!s)
    };
}
