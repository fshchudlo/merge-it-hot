import { contextBlock, divider, link, section } from "../utils/slack-building-blocks";
import { formatUserName } from "../utils";
import { PullRequestNotification, PullRequestPayload, PullRequestReviewSubmittedNotification } from "../../contracts";
import { WebhookPayloadHandler } from "../WebhookPayloadHandler";
import { SendMessageArguments, SlackTargetedChannel } from "../../slack-api-ports";

export class PullRequestReviewSubmittedHandler implements WebhookPayloadHandler {
    public canHandle(payload: PullRequestNotification) {
        return payload.eventKey == "pr:review:submitted";
    }

    public async handle(payload: PullRequestReviewSubmittedNotification, slackChannel: SlackTargetedChannel) {
        await slackChannel.sendMessage(buildSlackMessage(payload));
    }
}

function buildSlackMessage(payload: PullRequestReviewSubmittedNotification): SendMessageArguments {
    const pullRequest = payload.pullRequest;
    const messageTitle = getReviewerActionDescription(payload);
    const reviewStatus = getReviewStatus(pullRequest);
    return {
        text: messageTitle,
        blocks: [section(messageTitle), divider(), contextBlock(reviewStatus)]
    };
}

function getReviewerActionDescription(payload: PullRequestReviewSubmittedNotification) {
    const prLink = link(payload.pullRequest.links.self, "pull request");
    switch (payload.review.state) {
        case "DISMISSED":
            return `:traffic_light: ${formatUserName(payload.actor)} dismissed ${prLink}.`;
        case "CHANGES_REQUESTED":
            return `:traffic_light: ${formatUserName(payload.actor)} requested changes for the ${prLink}.`;
        case "APPROVED":
            return `:traffic_light: ${formatUserName(payload.actor)} approved ${prLink}.`;
        case "COMMENTED":
            return `:traffic_light: ${formatUserName(payload.actor)} submitted review comments to the ${prLink}.`;
    }
}

function getReviewStatus(pullRequest: PullRequestPayload) {
    const whoApproved = pullRequest.reviewers.filter(r => r.status == "APPROVED").map(r => r.user.name);
    const whoRequestedWork = pullRequest.reviewers.filter(r => r.status == "NEEDS_WORK").map(r => r.user.name);
    const whoUnapproved = pullRequest.reviewers.filter(r => r.status == "UNAPPROVED").map(r => r.user.name);

    if (whoRequestedWork.length == 0 && whoUnapproved.length == 0) {
        return `:large_green_circle: All reviewers approved PR. Seems like you can ${link(pullRequest.links.self, "merge it")}.`;
    }

    const reviewStatuses = [` Approved: ${whoApproved.length == 0 ? "0" : whoApproved.join(",")}`];
    whoRequestedWork.length > 0 ? reviewStatuses.push(` Requested changes: ${whoRequestedWork.join(",")}`) : "";
    whoUnapproved.length > 0 ? reviewStatuses.push(` Not reviewed: ${whoUnapproved.join(",")}`) : "";

    return `:large_yellow_circle: ${reviewStatuses.join(" | ")}`;
}