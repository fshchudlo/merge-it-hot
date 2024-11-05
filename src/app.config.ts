import "dotenv/config";
import { PullRequestEvent } from "./pr-events-handling/event-contracts";

export const AppConfig = {
    NODE_ENV: process.env.NODE_ENV,
    HMAC_SECRET: process.env.HMAC_SECRET as string,

    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET as string,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_BOT_PORT: parseInt(process.env.SLACK_BOT_PORT, 10) || 8080,
    SLACK_BOT_HOST: process.env.SLACK_BOT_HOST || "0.0.0.0",
    DIAGNOSTIC_CHANNEL: process.env.DIAGNOSTIC_CHANNEL,

    BITBUCKET_READ_API_TOKEN: process.env.BITBUCKET_READ_API_TOKEN,
    BITBUCKET_BASE_URL: process.env.BITBUCKET_BASE_URL,
    DEFAULT_CHANNEL_PARTICIPANTS: process.env.DEFAULT_CHANNEL_PARTICIPANTS?.split(",").map(u => u.trim()),

    GITHUB_APP_ID: +process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),

    /*
    * You can implement any other logic depending on the granularity level you need
    * */
    getOpenedPRBroadcastChannel(payload: PullRequestEvent): string | null {
        const configuredBotUsers = process.env.BOT_USER_NAMES?.split(",").map(u => u.trim());
        const projectKey = payload.pullRequest.targetBranch.projectKey;
        const prAuthor = payload.pullRequest.author.name;

        let channelName = null;

        if (configuredBotUsers?.find(u => u == prAuthor)) {
            channelName = process.env[`${projectKey.toUpperCase()}_BOT_OPENED_PRS_BROADCAST_CHANNEL`]
                ?? process.env.BOT_OPENED_PRS_BROADCAST_CHANNEL;
        }
        if (!channelName) {
            channelName = process.env[`${projectKey.toUpperCase()}_OPENED_PRS_BROADCAST_CHANNEL`]
                ?? process.env.OPENED_PRS_BROADCAST_CHANNEL;
        }
        return channelName ?? null;
    }
};
