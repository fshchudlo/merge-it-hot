import handlePullRequestEvent from "../../../use-cases/handlePullRequestEvent";
import BitbucketAPI from "../../../adapters/BitbucketAPI";
import { AppConfig } from "../../../app.config";
import { NextFunction, Request, Response } from "express";
import { transformRequestPayloadToEvent } from "./transformRequestPayloadToEvent";
import { SlackChannelProvisioner } from "../../../adapters/slack-api/SlackChannelProvisioner";
import { PullRequestGenericNotification } from "../../../use-cases/contracts";
import { SlackUserIdResolver } from "../ports/SlackUserIdResolver";

const bitbucketAPI = new BitbucketAPI(AppConfig.BITBUCKET_BASE_URL, AppConfig.BITBUCKET_READ_API_TOKEN);

export async function handleBitbucketWebhook(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner, slackUserIdResolver: SlackUserIdResolver) {
    try {
        const payload = await transformRequestPayloadToEvent(req.body, bitbucketAPI, slackUserIdResolver);
        const broadcastChannelName = AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.getBroadcastChannel(broadcastChannelName, ":bitbucket:") : null;


        const provisionResult = await slackChannelFactory.provisionChannelFor(payload, ":bitbucket:", AppConfig.USE_PRIVATE_CHANNELS, AppConfig.DEFAULT_CHANNEL_PARTICIPANTS);

        if (!provisionResult.isSetUpProperly) {
            const payloadToReplay = <PullRequestGenericNotification>{
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

