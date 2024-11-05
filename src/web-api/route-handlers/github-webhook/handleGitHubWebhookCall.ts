import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { transformRequestPayloadToEvent } from "../../payload-normalization/github/transformRequestPayloadToEvent";
import { AppConfig } from "../../../app.config";
import handlePullRequestEvent from "../../../pr-events-handling/handlePullRequestEvent";
import { SlackUserIdResolver } from "../../payload-normalization/SlackUserIdResolver";
import GitHubAPI from "../../../api-adapters/github-api/GitHubAPI";
import { GitHubPullRequestEventType } from "../../payload-normalization/github/GitHub.contracts";

export async function handleGitHubWebhookCall(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner, slackUserIdResolver: SlackUserIdResolver) {
    try {
        if (!req.body?.organization?.id) {
            throw new Error("Organization ID is missing in the request payload");
        }
        const githubAPI = new GitHubAPI(AppConfig.GITHUB_APP_ID, AppConfig.GITHUB_APP_PRIVATE_KEY, +req.body.organization.id);

        const eventType = req.headers["x-github-event"] as GitHubPullRequestEventType;

        const payload = await transformRequestPayloadToEvent(eventType, req.body, slackUserIdResolver, githubAPI);
        const broadcastChannelName = AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.findBroadcastChannel(broadcastChannelName, ":github:") : null;

        const targetedChannel = await slackChannelFactory.provisionTargetedChannel(payload, ":github:", AppConfig.DEFAULT_CHANNEL_PARTICIPANTS);

        await handlePullRequestEvent(payload, targetedChannel, broadcastChannel);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}