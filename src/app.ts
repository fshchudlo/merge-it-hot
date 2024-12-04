import "reflect-metadata";

import { OrgSettingsDB } from "./api-adapters/organization-settings/OrgSettingsDB";

import { App, ExpressReceiver } from "@slack/bolt";
import { AppConfig } from "./app.config";
import express, { NextFunction, Request } from "express";
import { SlackChannelProvisioner } from "./api-adapters/slack-api/SlackChannelProvisioner";
import measureRequestDuration from "./app.metrics";
import handleError from "./web-api/middlewares/handleError";
import { register } from "prom-client";
import { handleGitHubWebhookCall } from "./web-api/route-handlers/github-webhook/handleGitHubWebhookCall";
import bodyParser from "body-parser";
import verifyHMACSignature from "./web-api/middlewares/verifyHMACSignature";
import { SlackWebClientUserIdResolver } from "./api-adapters/slack-api/SlackWebClientUserIdResolver";
import { getSlackChannelInfo } from "./web-api/route-handlers/slack-channel/getSlackChannelInfo";
import { OrganizationSettingsProvider } from "./api-adapters/organization-settings/OrganizationSettingsProvider";

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
    expressReceiver.router.use(
        bodyParser.json({
            verify: (req: Request, _res: Response, buf: Buffer) => {
                req.rawBody = buf.toString();
            },
            limit: AppConfig.REQUEST_BODY_SIZE_LIMIT
        } as any)
    );
} else {
    expressReceiver.router.use(
        express.json({ limit: AppConfig.REQUEST_BODY_SIZE_LIMIT })
    );
}
expressReceiver.router.use(measureRequestDuration);

expressReceiver.router.post(
    "/github-webhook",
    verifyHMACSignature,
    async (req, res, next: NextFunction) => {
        await handleGitHubWebhookCall(
            req,
            res,
            next,
            slackChannelFactory,
            userIdResolver
        );
    }
);

expressReceiver.router.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});
expressReceiver.router.get(
    "/slack-channel",
    async (req, res, next: NextFunction) => {
        return await getSlackChannelInfo(req, res, next, slackChannelFactory);
    }
);

expressReceiver.router.get("/health", async (req, res) => {
    return res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

expressReceiver.router.use(
    async (
        error: any,
        req: express.Request,
        res: express.Response,
        next: NextFunction
    ) => {
        return handleError(error, res, next, slackApp.client);
    }
);

OrgSettingsDB.initialize().then(() => {
    slackApp.start({
        port: AppConfig.SLACK_BOT_PORT,
        host: AppConfig.SLACK_BOT_HOST
    }).then(async () => {
        await OrganizationSettingsProvider.provisionFromGithubInstallations(
            AppConfig.SLACK_WORKSPACE_ID,
            AppConfig.GITHUB_APP_ID,
            AppConfig.GITHUB_APP_PRIVATE_KEY
        );
        console.log(
            `⚡️ Merge-it-hot app is running on ${AppConfig.SLACK_BOT_HOST}:${AppConfig.SLACK_BOT_PORT}!`
        );
    });
});
