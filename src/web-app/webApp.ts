import "reflect-metadata";

import { OrgSettingsDB } from "../adapters/organization-settings-provider/OrgSettingsDB";

import { AppConfig } from "../app.config";
import express, { NextFunction, Request } from "express";
import { SlackChannelProvisioner } from "../adapters/slack-api/SlackChannelProvisioner";
import measureRequestDuration from "./web-request-handlers/express-middlewares/measureRequestDuration";
import handleError from "./web-request-handlers/express-middlewares/handleError";
import { register } from "prom-client";
import { handleGitHubWebhookCall } from "./web-request-handlers/github-webhook/handleGitHubWebhookCall";
import bodyParser from "body-parser";
import verifyHMACSignature from "./web-request-handlers/express-middlewares/verifyHMACSignature";
import { SlackWebClientUserIdResolver } from "../adapters/slack-api/SlackWebClientUserIdResolver";
import { getSlackChannelInfo } from "./web-request-handlers/slack-channel/getSlackChannelInfo";
import { slackApp } from "../slack-app/slackApp";

const slackChannelFactory = new SlackChannelProvisioner(slackApp.client);
const userIdResolver = new SlackWebClientUserIdResolver(slackApp.client);

const webApp = express();
if (AppConfig.HMAC_SECRET) {
    webApp.use(
        bodyParser.json({
            verify: (req: Request, _res: Response, buf: Buffer) => {
                req.rawBody = buf.toString();
            },
            limit: AppConfig.REQUEST_BODY_SIZE_LIMIT
        } as any)
    );
} else {
    webApp.use(express.json({ limit: AppConfig.REQUEST_BODY_SIZE_LIMIT }));
}
webApp.use(measureRequestDuration);

webApp.post("/github-webhook", verifyHMACSignature, async (req, res, next: NextFunction) => {
    await handleGitHubWebhookCall(req, res, next, slackChannelFactory, userIdResolver);
});

webApp.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});
webApp.get("/slack-channel", async (req, res, next: NextFunction) => {
    return await getSlackChannelInfo(req, res, next, slackChannelFactory);
});

webApp.get("/health", async (req, res) => {
    res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

webApp.use(async (error: any, req: express.Request, res: express.Response, next: NextFunction) => {
    return handleError(error, res, next, slackApp.client);
});

OrgSettingsDB.initialize().then(async () => {
    slackApp
        .start()
        .then(() => {
            console.log(`⚡️ Slack bot is running in Socket Mode!`);
        })
        .catch(err => {
            console.error("Error starting Slack bot:", err);
        });

    webApp.listen(AppConfig.SLACK_BOT_PORT, AppConfig.SLACK_BOT_HOST, () => {
        console.log(`🌐 Web API is running on port ${AppConfig.SLACK_BOT_PORT}`);
    });
});
