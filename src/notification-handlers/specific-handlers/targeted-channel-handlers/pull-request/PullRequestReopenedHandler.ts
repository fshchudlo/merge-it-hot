import { link, section } from "@slack-building-blocks";
import { reviewPRAction } from "../../internals";
import { PullRequestGenericEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../../ports/SendMessageArguments";

export class PullRequestReopenedHandler implements PullRequestEventHandler {
    public canHandle(payload: PullRequestGenericEvent) {
        return payload.eventKey == "pr:reopened";
    }

    public async handle(
        payload: PullRequestGenericEvent,
        slackChannel: SlackTargetedChannel,
    ) {
        await slackChannel.setTopic(payload.pullRequest.title);
        await slackChannel.sendMessage(buildMessage(payload));
    }
}

function buildMessage(payload: PullRequestGenericEvent): SendMessageArguments {
    const messageTitle = `:recycle: ${payload.actor.name} reopened ${link(payload.pullRequest.links.self, "pull request")}`;
    return {
        text: messageTitle,
        blocks: [section(messageTitle), reviewPRAction(payload.pullRequest)],
    };
}
