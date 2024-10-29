import { italic, section } from "../utils/slack-building-blocks";
import { reviewPRAction } from "../utils";
import { PullRequestGenericEvent } from "../../event-contracts";
import { PullRequestEventHandler } from "../PullRequestEventHandler";
import { SendMessageArguments, SlackTargetedChannel } from "../../slack-api-ports";

export class PullRequestIsReadyForReviewHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestGenericEvent) {
        return payload.eventKey == "pr:ready_for_review";
    }

    async handle(payload: PullRequestGenericEvent, slackChannel: SlackTargetedChannel) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
    }
}

function buildSlackMessage(payload: PullRequestGenericEvent): SendMessageArguments {
    const messageTitle = `:sparkler: ${payload.actor.name} marked the pull request as ${italic("ready for review")}!`;

    return {
        text: messageTitle,
        blocks: [section(messageTitle), reviewPRAction(payload.pullRequest)].filter(s => !!s)
    };
}
