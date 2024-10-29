import handlePullRequestEvent from "../../../pr-events-handler/handlePullRequestEvent";
import BitbucketAPI from "../../../api-adapters/BitbucketAPI";
import { AppConfig } from "../../../app.config";
import { NextFunction, Request, Response } from "express";
import { transformRequestPayloadToEvent } from "../../payload-normalization/bitbucket/transformRequestPayloadToEvent";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { PullRequestGenericEvent } from "../../../pr-events-handler/event-contracts";
import { SlackUserIdResolver } from "../../payload-normalization/SlackUserIdResolver";

const bitbucketAPI = new BitbucketAPI(AppConfig.BITBUCKET_BASE_URL, AppConfig.BITBUCKET_READ_API_TOKEN);

export async function handleBitbucketWebhookCall(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner, slackUserIdResolver: SlackUserIdResolver) {
    try {
        const payload = await transformRequestPayloadToEvent(req.body, bitbucketAPI, slackUserIdResolver);
        const broadcastChannelName = AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.getBroadcastChannel(broadcastChannelName, ":bitbucket:") : null;


        const provisionResult = await slackChannelFactory.provisionChannelFor(payload, ":bitbucket:", AppConfig.USE_PRIVATE_CHANNELS, AppConfig.DEFAULT_CHANNEL_PARTICIPANTS);

        if (!provisionResult.isSetUpProperly) {
            const payloadToReplay = <PullRequestGenericEvent>{
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

