import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { transformRequestPayloadToEvent } from "../../../github-payload-to-event-mapping/transformRequestPayloadToEvent";
import { AppConfig } from "../../../app.config";
import handlePullRequestEvent from "../../../pr-events-handler/handlePullRequestEvent";
import { SlackUserIdResolver } from "../../../github-payload-to-event-mapping/SlackUserIdResolver";
import GitHubWebAPIAdapter from "../../../api-adapters/github-api/GitHubWebAPIAdapter";
import { GitHubPullRequestEventType } from "../../../github-payload-to-event-mapping/GitHub.contracts";
import { OrganizationSettingsProvider } from "../../../api-adapters/organization-settings/OrganizationSettingsProvider";

export async function handleGitHubWebhookCall(
    req: Request,
    res: Response,
    next: NextFunction,
    slackChannelFactory: SlackChannelProvisioner,
    slackUserIdResolver: SlackUserIdResolver
) {
    try {
        const eventType = req.headers["x-github-event"] as string;
        if (
            [
                "installation_repositories",
                "new_permissions_accepted",
                "installation"
            ].includes(eventType)
        ) {
            console.log(
                `${eventType} event triggered for the installation: ${req.body.installation.account.login} ${req.body.installation.account.type.toLowerCase()}`
            );
            res.sendStatus(200);
            return;
        }

        if (!req.body?.organization?.id) {
            throw new Error(
                "Organization ID is missing in the request payload"
            );
        }
        const githubAPI = new GitHubWebAPIAdapter(
            AppConfig.GITHUB_APP_ID,
            AppConfig.GITHUB_APP_PRIVATE_KEY,
            +req.body.organization.id
        );

        const payload = await transformRequestPayloadToEvent(
            eventType as GitHubPullRequestEventType,
            req.body,
            slackUserIdResolver,
            githubAPI
        );
        if (payload.eventKey === "ignored_event") {
            res.sendStatus(200);
            return;
        }

        const organizationSettings = await OrganizationSettingsProvider.fetch(AppConfig.SLACK_WORKSPACE_ID, req.body.organization.id, req.body.organization.login);

        const broadcastChannelName = payload.pullRequest.author.isBotUser ? organizationSettings.openedBotPRsBroadcastChannel : organizationSettings.openedPRsBroadcastChannel;
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.findBroadcastChannel(broadcastChannelName, ":github:") : null;

        const targetedChannel = await slackChannelFactory.provisionTargetedChannel(
            payload,
            ":github:",
            organizationSettings.defaultChannelParticipants
        );

        await handlePullRequestEvent(payload, targetedChannel, broadcastChannel);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}
