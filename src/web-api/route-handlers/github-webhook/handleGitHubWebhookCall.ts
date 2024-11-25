import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { transformRequestPayloadToEvent } from "../../../github-payload-to-event-mapping/transformRequestPayloadToEvent";
import { AppConfig } from "../../../app.config";
import handlePullRequestEvent from "../../../event-handlers/handlePullRequestEvent";
import { SlackUserIdResolver } from "../../../github-payload-to-event-mapping/SlackUserIdResolver";
import GitHubAPI from "../../../api-adapters/github-api/GitHubAPI";
import { GitHubPullRequestEventType } from "../../../github-payload-to-event-mapping/GitHub.contracts";

export async function handleGitHubWebhookCall(
    req: Request,
    res: Response,
    next: NextFunction,
    slackChannelFactory: SlackChannelProvisioner,
    slackUserIdResolver: SlackUserIdResolver,
) {
    try {
        const eventType = req.headers["x-github-event"] as string;
        if (
            [
                "installation_repositories",
                "new_permissions_accepted",
                "installation",
            ].includes(eventType)
        ) {
            console.log(
                `${eventType} event triggered for the installation: ${req.body.installation.account.login} ${req.body.installation.account.type.toLowerCase()}`,
            );
            res.sendStatus(200);
            return;
        }

        if (!req.body?.organization?.id) {
            throw new Error(
                "Organization ID is missing in the request payload",
            );
        }
        const githubAPI = new GitHubAPI(
            AppConfig.GITHUB_APP_ID,
            AppConfig.GITHUB_APP_PRIVATE_KEY,
            +req.body.organization.id,
        );

        const payload = await transformRequestPayloadToEvent(
            eventType as GitHubPullRequestEventType,
            req.body,
            slackUserIdResolver,
            githubAPI,
        );
        if (payload.eventKey === "ignored_event") {
            res.sendStatus(200);
            return;
        }

        const broadcastChannelName =
            AppConfig.getOpenedPRBroadcastChannel(payload);
        const broadcastChannel = broadcastChannelName
            ? await slackChannelFactory.findBroadcastChannel(
                  broadcastChannelName,
                  ":github:",
              )
            : null;

        const targetedChannel =
            await slackChannelFactory.provisionTargetedChannel(
                payload,
                ":github:",
                AppConfig.DEFAULT_CHANNEL_PARTICIPANTS,
            );

        await handlePullRequestEvent(
            payload,
            targetedChannel,
            broadcastChannel,
        );

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}
