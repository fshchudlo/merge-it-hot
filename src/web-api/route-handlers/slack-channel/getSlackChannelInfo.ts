import { NextFunction, Request, Response } from "express";
import { SlackChannelProvisioner } from "../../../api-adapters/slack-api/SlackChannelProvisioner";
import { buildChannelName } from "../../../api-adapters/slack-api/buildChannelName";

export async function getSlackChannelInfo(req: Request, res: Response, next: NextFunction, slackChannelFactory: SlackChannelProvisioner) {
    const { pullRequestId, repositorySlug, projectKey } = req.query;

    if (!pullRequestId || !repositorySlug || !projectKey) {
        return res.status(400).send("Please, specify valid \"pullRequestId\", \"repositorySlug\" and \"projectKey\" as query parameters.");
    }

    try {
        const channelName = buildChannelName({
            pullRequestId: <string>pullRequestId,
            repositorySlug: <string>repositorySlug,
            projectKey: <string>projectKey
        });

        const channelInfo = await slackChannelFactory.getChannelInfo(channelName);

        channelInfo ? res.send(channelInfo) : res.sendStatus(404);
    } catch (error) {
        next(error);
    }
}