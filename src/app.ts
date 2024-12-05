import "reflect-metadata";

import { OrgSettingsDB } from "./api-adapters/organization-settings/OrgSettingsDB";

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
import { slackApp } from "./slackApp";


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
    webApp.use(
        express.json({ limit: AppConfig.REQUEST_BODY_SIZE_LIMIT })
    );
}
webApp.use(measureRequestDuration);

webApp.post(
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

webApp.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});
webApp.get(
    "/slack-channel",
    async (req, res, next: NextFunction) => {
        return await getSlackChannelInfo(req, res, next, slackChannelFactory);
    }
);

webApp.get("/health", async (req, res) => {
    return res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

webApp.use(
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
    slackApp.start()
        .then(() => {
            console.log(`⚡️ Slack bot is running in Socket Mode!`);
        })
        .catch((err) => {
            console.error("Error starting Slack bot:", err);
        });

    webApp.listen(AppConfig.SLACK_BOT_PORT, AppConfig.SLACK_BOT_HOST, () => {
        console.log(`🌐 Web API is running on port ${AppConfig.SLACK_BOT_PORT}`);
    });
});
