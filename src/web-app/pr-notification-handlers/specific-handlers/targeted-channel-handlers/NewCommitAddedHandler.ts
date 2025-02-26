import { link, quote, section } from "@slack-building-blocks";
import { markdownToSlackMarkup, reviewPRAction } from "../internals";
import { PullRequestFromBranchUpdatedEvent } from "../../event-contracts";
import { PullRequestEventHandler } from "../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../ports/SendMessageArguments";
import shouldBeAddedAsParticipant from "../internals/shouldBeAddedAsParticipant";

export class NewCommitAddedHandler implements PullRequestEventHandler {
    canHandle(payload: PullRequestFromBranchUpdatedEvent) {
        return payload.eventKey == "pr:from_ref_updated";
    }

    async handle(payload: PullRequestFromBranchUpdatedEvent, slackChannel: SlackTargetedChannel) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
        if (shouldBeAddedAsParticipant(payload, payload.actor)) {
            await slackChannel.inviteToChannel(payload.actor.slackUserId);
        }
    }
}

function buildSlackMessage(payload: PullRequestFromBranchUpdatedEvent): SendMessageArguments {
    const messageTitle = `:new: ${payload.actor.name} added ${link(payload.latestCommitViewUrl, "new commit")}.`;

    const commentSection = payload.latestCommitMessage ? section(`Commit message: \n${quote(markdownToSlackMarkup(payload.latestCommitMessage))}`) : null;
    return {
        text: messageTitle,
        blocks: [section(messageTitle), commentSection, reviewPRAction(payload.pullRequest)].filter(s => !!s)
    };
}
