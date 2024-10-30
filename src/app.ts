import { App, ExpressReceiver } from "@slack/bolt";
import { AppConfig } from "./app.config";
import express, { NextFunction } from "express";
import { handleBitbucketWebhookCall } from "./web-api/route-handlers/bitbucket-webhook/handleBitbucketWebhookCall";
import { SlackChannelProvisioner } from "./api-adapters/slack-api/SlackChannelProvisioner";
import measureRequestDuration from "./app.metrics";
import  handleError from "./web-api/middlewares/handleError";
import { register } from "prom-client";
import { handleGitHubWebhookCall } from "./web-api/route-handlers/github-webhook/handleGitHubWebhookCall";
import bodyParser from "body-parser";
import verifyHMACSignature from "./web-api/middlewares/verifyHMACSignature";
import { SlackWebClientUserIdResolver } from "./api-adapters/slack-api/SlackWebClientUserIdResolver";
import { getSlackChannelInfo } from "./web-api/route-handlers/slack-channel/getSlackChannelInfo";


const expressReceiver = new ExpressReceiver({
    signingSecret: AppConfig.SLACK_SIGNING_SECRET
});

const slackApp = new App({
    token: AppConfig.SLACK_BOT_TOKEN,
    receiver: expressReceiver
});

const slackChannelFactory = new SlackChannelProvisioner(slackApp.client);
const userIdResolver = new SlackWebClientUserIdResolver(slackApp.client);

if (AppConfig.HMAC_SECRET) {
    expressReceiver.router.use(bodyParser.json({
        verify: (req: Request, _res: Response, buf: Buffer) => {
            (req as any).rawBody = buf.toString();
        }
    } as any));
} else {
    expressReceiver.router.use(express.json());
}
expressReceiver.router.use(measureRequestDuration);

expressReceiver.router.post("/bitbucket-webhook", verifyHMACSignature, async (req, res, next: NextFunction) => {
    await handleBitbucketWebhookCall(req, res, next, slackChannelFactory, userIdResolver);
});

expressReceiver.router.post("/github-webhook", verifyHMACSignature, async (req, res, next: NextFunction) => {
    await handleGitHubWebhookCall(req, res, next, slackChannelFactory, userIdResolver);
});

expressReceiver.router.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});
expressReceiver.router.get("/slack-channel", async (req, res, next: NextFunction) => {
    return await getSlackChannelInfo(req, res, next, slackChannelFactory);
});

expressReceiver.router.get("/health", async (req, res) => {
    return res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

expressReceiver.router.use(async (error: any, req: express.Request, res: express.Response, next: NextFunction) => {
    return handleError(error, res, next, slackApp.client);
});

expressReceiver.app.listen(AppConfig.SLACK_BOT_PORT, AppConfig.SLACK_BOT_HOST, () => {
    console.log(`⚡️ Merge-it-hot app is running on ${AppConfig.SLACK_BOT_HOST}:${AppConfig.SLACK_BOT_PORT}!`);
});