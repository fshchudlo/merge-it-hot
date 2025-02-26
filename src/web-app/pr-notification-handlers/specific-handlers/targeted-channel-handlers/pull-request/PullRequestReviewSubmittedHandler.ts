import { contextBlock, divider, link, quote, section } from "@slack-building-blocks";
import { markdownToSlackMarkup } from "../../internals";
import { PullRequestEvent, PullRequestPayload, PullRequestReviewSubmittedEvent } from "../../../event-contracts";
import { PullRequestEventHandler } from "../../PullRequestEventHandler";
import { SlackTargetedChannel } from "../../../ports/SlackTargetedChannel";
import { SendMessageArguments } from "../../../ports/SendMessageArguments";
import shouldBeAddedAsParticipant from "../../internals/shouldBeAddedAsParticipant";

export class PullRequestReviewSubmittedHandler implements PullRequestEventHandler {
    public canHandle(payload: PullRequestEvent) {
        return payload.eventKey == "pr:review:submitted";
    }

    public async handle(payload: PullRequestReviewSubmittedEvent, slackChannel: SlackTargetedChannel) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
        if (shouldBeAddedAsParticipant(payload, payload.actor)) {
            await slackChannel.inviteToChannel(payload.actor.slackUserId);
        }
    }
}

function buildSlackMessage(payload: PullRequestReviewSubmittedEvent): SendMessageArguments {
    const pullRequest = payload.pullRequest;
    const messageTitle = getReviewerActionDescription(payload);

    return {
        text: messageTitle,
        blocks: [section(messageTitle), ...getReviewStatusBlocks(pullRequest)]
    };
}

function getReviewerActionDescription(payload: PullRequestReviewSubmittedEvent) {
    const prLink = link(payload.pullRequest.links.self, "pull request");
    const commentPart = payload.review.comment ? ` with the message: \n${quote(markdownToSlackMarkup(payload.review.comment))}` : ".";
    switch (payload.review.state) {
        case "DISMISSED":
            return `:traffic_light: ${payload.actor.name} dismissed ${prLink}${commentPart}`;
        case "CHANGES_REQUESTED":
            return `:traffic_light: ${payload.actor.name} requested changes for the ${prLink}${commentPart}`;
        case "APPROVED":
            return `:traffic_light: ${payload.actor.name} approved ${prLink}${commentPart}`;
        case "COMMENTED":
            return `:traffic_light: ${payload.actor.name} submitted review comments to the ${prLink}${commentPart}`;
        default:
            throw new Error(`Unknown review state: ${payload.review.state}`);
    }
}

function getReviewStatusBlocks(pullRequest: PullRequestPayload) {
    if (pullRequest.participants.every(r => !r.status)) {
        return [];
    }

    const whoApproved = pullRequest.participants.filter(r => r.status == "APPROVED").map(r => r.user.name);
    const whoRequestedWork = pullRequest.participants.filter(r => r.status == "NEEDS_WORK").map(r => r.user.name);
    const whoUnapproved = pullRequest.participants.filter(r => r.status == "UNAPPROVED").map(r => r.user.name);

    let result;
    if (whoRequestedWork.length == 0 && whoUnapproved.length == 0) {
        result = `:large_green_circle: All reviewers approved PR. Seems like you can ${link(pullRequest.links.self, "merge it")}.`;
    } else {
        const reviewStatuses = [` Approved: ${whoApproved.length == 0 ? "0" : whoApproved.join(",")}`];
        whoRequestedWork.length > 0 ? reviewStatuses.push(` Requested changes: ${whoRequestedWork.join(",")}`) : "";
        whoUnapproved.length > 0 ? reviewStatuses.push(` Not reviewed: ${whoUnapproved.join(",")}`) : "";
        result = `:large_yellow_circle: ${reviewStatuses.join(" | ")}`;
    }
    return [divider(), contextBlock(result)];
}
