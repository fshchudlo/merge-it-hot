import handlePullRequestEvent from "../../../pr-events-handling/handlePullRequestEvent";
import BitbucketAPI from "../../../api-adapters/BitbucketAPI";
import { AppConfig } from "../../../app.config";
import { NextFunction, Request, Response } from "express";
import { transformRequestPayloadToEvent } from "../../payload-normalization/bitbucket/transformRequestPayloadToEvent";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { SlackUserIdResolver } from "../../payload-normalization/SlackUserIdResolver";

const bitbucketAPI = new BitbucketAPI(AppConfig.BITBUCKET_BASE_URL, AppConfig.BITBUCKET_READ_API_TOKEN);

export async function handleBitbucketWebhookCall(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner, slackUserIdResolver: SlackUserIdResolver) {
    try {
        const payload = await transformRequestPayloadToEvent(req.body, bitbucketAPI, slackUserIdResolver);
        const broadcastChannelName = AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.findBroadcastChannel(broadcastChannelName, ":bitbucket:") : null;
        const targetedChannel = await slackChannelFactory.provisionTargetedChannel(payload, ":bitbucket:", AppConfig.DEFAULT_CHANNEL_PARTICIPANTS);

        await handlePullRequestEvent(payload, targetedChannel, broadcastChannel);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

