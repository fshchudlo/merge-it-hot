import { link, quote, section } from "../utils/slack-building-blocks";
import { markdownToSlackMarkup, reviewPRAction } from "../utils";
import { PullRequestFromBranchUpdatedEvent } from "../../event-contracts";
import { PullRequestEventHandler } from "../PullRequestEventHandler";
import {
    SendMessageArguments,
    SlackTargetedChannel,
} from "../../slack-api-ports";

export class NewCommitAddedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestFromBranchUpdatedEvent) {
        return payload.eventKey == "pr:from_ref_updated";
    }

    async handle(
        payload: PullRequestFromBranchUpdatedEvent,
        slackChannel: SlackTargetedChannel,
    ) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
    }
}

function buildSlackMessage(
    payload: PullRequestFromBranchUpdatedEvent,
): SendMessageArguments {
    const messageTitle = `:new: ${payload.actor.name} added ${link(payload.latestCommitViewUrl, "new commit")}.`;

    const commentSection = payload.latestCommitMessage
        ? section(
              `Commit message: \n${quote(markdownToSlackMarkup(payload.latestCommitMessage))}`,
          )
        : null;
    return {
        text: messageTitle,
        blocks: [
            section(messageTitle),
            commentSection,
            reviewPRAction(payload.pullRequest),
        ].filter(s => !!s),
    };
}
