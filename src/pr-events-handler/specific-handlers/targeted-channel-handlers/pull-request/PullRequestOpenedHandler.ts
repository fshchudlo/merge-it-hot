import {
    link,
    section,
    divider,
    contextBlock,
    italic
} from "@slack-building-blocks";
import {
    markdownToSlackMarkup,
    reviewPRAction
} from "../../utils";
import { PullRequestGenericEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import {
    SendMessageArguments,
    SlackTargetedChannel
} from "../../../slack-api-ports";

export class PullRequestOpenedHandler implements PullRequestEventHandler {
    public canHandle(payload: PullRequestGenericEvent) {
        return payload.eventKey == "pr:opened";
    }

    public async handle(
        payload: PullRequestGenericEvent,
        slackChannel: SlackTargetedChannel
    ) {
        await setChannelBookmark(payload, slackChannel);
        await slackChannel.setTopic(payload.pullRequest.title);
        await slackChannel.sendMessage(buildInvitationMessage(payload));
    }
}

async function setChannelBookmark(
    payload: PullRequestGenericEvent,
    slackChannel: SlackTargetedChannel
) {
    await slackChannel.addBookmark({
        link: payload.pullRequest.links.self,
        emoji: ":git:",
        title: "Review Pull Request"
    });
}

function buildInvitationMessage(
    payload: PullRequestGenericEvent
): SendMessageArguments {
    const prStateName = payload.pullRequest.isDraft
        ? `${italic("draft")} pull request`
        : "pull request";

    const messageTitle = `${payload.actor.name} opened ${link(payload.pullRequest.links.self, prStateName)}`;
    const descriptionText = markdownToSlackMarkup(
        payload.pullRequest.description ?? payload.pullRequest.title
    );
    return {
        text: messageTitle,
        blocks: [
            section(messageTitle),
            divider(),
            contextBlock(descriptionText),
            divider(),
            reviewPRAction(payload.pullRequest)
        ]
    };
}
