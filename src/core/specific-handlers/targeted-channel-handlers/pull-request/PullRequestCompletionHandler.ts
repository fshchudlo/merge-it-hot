import { PullRequestGenericEvent } from "../../../event-contracts";
import { getPullRequestCompletionAction } from "../../internals/getPullRequestCompletionAction";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../../ports/SendMessageArguments";

export class PullRequestCompletionHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestGenericEvent): boolean {
        return (
            payload.eventKey == "pr:merged" ||
            payload.eventKey == "pr:declined" ||
            payload.eventKey == "pr:deleted"
        );
    }

    async handle(
        payload: PullRequestGenericEvent,
        slackChannel: SlackTargetedChannel,
    ): Promise<void> {
        const message = buildCompletionMessage(payload);
        await slackChannel.sendMessage(message);

        await slackChannel.closeChannel();
    }
}

function buildCompletionMessage(
    payload: PullRequestGenericEvent,
): SendMessageArguments {
    const completionAction = getPullRequestCompletionAction(payload);
    return {
        text: `${completionAction.emoji} ${completionAction.text}`,
    };
}
