import {
    contextBlock,
    divider,
    section,
} from "../../utils/slack-building-blocks";
import {
    markdownToSlackMarkup,
    reviewPRAction,
    trimTextToSlackMessageLimits,
} from "../../utils";
import { PullRequestModifiedEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../slack-api-ports";

export class PullRequestModifiedHandler implements PullRequestEventHandler {
    public canHandle(payload: PullRequestModifiedEvent) {
        return payload.eventKey == "pr:modified";
    }

    public async handle(
        payload: PullRequestModifiedEvent,
        slackChannel: SlackTargetedChannel,
    ) {
        const visibleChanges = getPRChangesDescription(payload);
        if (visibleChanges.length == 0) {
            return;
        }

        const messageTitle = `:writing_hand: ${payload.actor.name} changed the pull request`;
        await slackChannel.sendMessage({
            text: messageTitle,
            blocks: [
                section(messageTitle),
                ...visibleChanges,
                divider(),
                reviewPRAction(payload.pullRequest),
            ],
        });
    }
}

function getPRChangesDescription(payload: PullRequestModifiedEvent) {
    const changesDescription = new Array<any>();
    const addDivider = () => {
        if (changesDescription.length > 0) {
            changesDescription.push(divider());
        }
    };
    const pullRequest = payload.pullRequest;

    if (
        pullRequest.targetBranch.branchName !=
        payload.previousTargetBranch?.branchName
    ) {
        addDivider();
        changesDescription.push(
            section(
                `Target is changed to \`${pullRequest.targetBranch.branchName}\``,
            ),
        );
    }
    if (pullRequest.title != payload.previousTitle) {
        addDivider();
        changesDescription.push(section(`Updated title:`));
        changesDescription.push(contextBlock(pullRequest.title));
    }
    if (pullRequest.description != payload.previousDescription) {
        addDivider();
        if (pullRequest.description) {
            changesDescription.push(section("Updated description:"));
            changesDescription.push(
                contextBlock(
                    trimTextToSlackMessageLimits(
                        markdownToSlackMarkup(pullRequest.description),
                    ),
                ),
            );
        } else {
            changesDescription.push(section("Description is deleted."));
        }
    }
    return changesDescription;
}
