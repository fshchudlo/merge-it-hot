import { SlackTargetedChannel } from "../slack-api-ports";
import { PullRequestEvent } from "../event-contracts";

export interface PullRequestEventHandler {
    canHandle(payload: PullRequestEvent): boolean;

    handle(
        payload: PullRequestEvent,
        slackChannel: SlackTargetedChannel,
    ): Promise<void>;
}
