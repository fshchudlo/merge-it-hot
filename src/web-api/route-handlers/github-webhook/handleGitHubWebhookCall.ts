import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { transformRequestPayloadToEvent } from "../../payload-normalization/github/transformRequestPayloadToEvent";
import { AppConfig } from "../../../app.config";
import { PullRequestEvent } from "../../../pr-events-handling/event-contracts";
import handlePullRequestEvent from "../../../pr-events-handling/handlePullRequestEvent";
import { SlackUserIdResolver } from "../../payload-normalization/SlackUserIdResolver";
import GitHubAPI from "../../../api-adapters/GitHubAPI";
import { GitHubNotification } from "../../payload-normalization/github/GitHub.contracts";

export async function handleGitHubWebhookCall(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner, slackUserIdResolver: SlackUserIdResolver) {
    try {
        const githubAPI = new GitHubAPI(AppConfig.tryGetGitHubReadToken((<GitHubNotification>req.body)?.organization?.login));

        const payload = await transformRequestPayloadToEvent(req.body, slackUserIdResolver, githubAPI);
        const broadcastChannelName = AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.getBroadcastChannel(broadcastChannelName, ":github:") : null;


        const provisionResult = await slackChannelFactory.provisionChannelFor(payload, ":github:", AppConfig.USE_PRIVATE_CHANNELS, AppConfig.DEFAULT_CHANNEL_PARTICIPANTS);

        if (!provisionResult.isSetUpProperly) {
            const payloadToReplay = <PullRequestEvent>{
                eventKey: "pr:opened",
                actor: {
                    name: payload.pullRequest.author.name,
                    slackUserId: payload.pullRequest.author.slackUserId
                },
                pullRequest: payload.pullRequest
            };
            await handlePullRequestEvent(payloadToReplay, provisionResult.channel, broadcastChannel);

        }

        await handlePullRequestEvent(payload, provisionResult.channel, broadcastChannel);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}