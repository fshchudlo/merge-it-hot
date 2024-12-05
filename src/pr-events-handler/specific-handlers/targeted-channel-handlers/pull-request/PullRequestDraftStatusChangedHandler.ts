import { italic, section } from "@slack-building-blocks";
import { PullRequestGenericEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import {
    SendMessageArguments,
    SlackTargetedChannel
} from "../../../slack-api-ports";

export class PullRequestDraftStatusChangedHandler
    implements PullRequestEventHandler {
    canHandle(payload: PullRequestGenericEvent) {
        return ["pr:ready_for_review", "pr:converted_to_draft"].includes(
            payload.eventKey
        );
    }

    async handle(
        payload: PullRequestGenericEvent,
        slackChannel: SlackTargetedChannel
    ) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
    }
}

function buildSlackMessage(payload: PullRequestGenericEvent): SendMessageArguments {
    let messageTitle;
    if (payload.eventKey === "pr:ready_for_review") {
        messageTitle = `:sparkler: ${payload.actor.name} marked the pull request as ${italic("ready for review")}`;
    } else {
        messageTitle = `:shushing_face: ${payload.actor.name} converted the pull request back to draft`;
    }
    return {
        text: messageTitle,
        blocks: [section(messageTitle)]
    };
}
