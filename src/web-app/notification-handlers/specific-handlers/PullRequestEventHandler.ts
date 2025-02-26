import { PullRequestEvent } from "../event-contracts";
import { SlackTargetedChannel } from "../ports/SlackTargetedChannel";

export interface PullRequestEventHandler {
    canHandle(payload: PullRequestEvent): boolean;

    handle(
        payload: PullRequestEvent,
        slackChannel: SlackTargetedChannel,
    ): Promise<void>;
}
