import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../adapters/slack-api/SlackChannelProvisioner";
import { transformGithubPayloadToAppEvent } from "./transformGithubPayloadToAppEvent/transformGithubPayloadToAppEvent";
import { AppConfig } from "../../../app.config";
import handlePullRequestEvent from "../../pr-notification-handlers/handlePullRequestEvent";
import { SlackUserIdResolver } from "./transformGithubPayloadToAppEvent/ports/SlackUserIdResolver";
import GitHubWebAPIAdapter from "../../../adapters/github-api/GitHubWebAPIAdapter";
import { GitHubPullRequestEventType } from "./transformGithubPayloadToAppEvent/GitHubAPI.contracts";
import { OrganizationSettingsProvider } from "../../../adapters/organization-settings-provider/OrganizationSettingsProvider";

export async function handleGitHubWebhookCall(
    req: Request,
    res: Response,
    next: NextFunction,
    slackChannelFactory: SlackChannelProvisioner,
    slackUserIdResolver: SlackUserIdResolver
) {
    try {
        const eventType = req.headers["x-github-event"] as string;
        if (["installation_repositories", "new_permissions_accepted", "installation"].includes(eventType)) {
            console.log(
                `${eventType} event triggered for the installation: ${req.body.installation.account.login} ${req.body.installation.account.type.toLowerCase()}`
            );
            res.sendStatus(200);
            return;
        }

        if (!req.body?.organization?.id) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Organization ID is missing in the request payload");
        }
        const githubAPI = new GitHubWebAPIAdapter(AppConfig.GITHUB_APP_ID, AppConfig.GITHUB_APP_PRIVATE_KEY, +req.body.organization.id);

        const payload = await transformGithubPayloadToAppEvent(eventType as GitHubPullRequestEventType, req.body, slackUserIdResolver, githubAPI);
        if (payload.eventKey === "ignored_event") {
            res.sendStatus(200);
            return;
        }

        const organizationSettings = await OrganizationSettingsProvider.fetch(
            AppConfig.SLACK_WORKSPACE_ID,
            req.body.organization.id,
            req.body.organization.login
        );
        if (organizationSettings.repositoriesToExclude.includes(payload.pullRequest.targetBranch.repositoryName)) {
            res.sendStatus(200);
            return;
        }

        const broadcastChannelName = payload.pullRequest.author.isBotUser
            ? organizationSettings.openedBotPRsBroadcastChannel
            : organizationSettings.openedPRsBroadcastChannel;
        const broadcastChannel = broadcastChannelName ? await slackChannelFactory.findBroadcastChannel(broadcastChannelName, ":github:") : null;

        const targetedChannel = await slackChannelFactory.provisionTargetedChannel(payload, ":github:", organizationSettings.defaultChannelParticipants);

        await handlePullRequestEvent(payload, targetedChannel, broadcastChannel);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}
