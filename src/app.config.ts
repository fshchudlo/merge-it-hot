import "dotenv/config";
import { PullRequestEvent } from "./event-handlers/event-contracts";

export const AppConfig = {
    NODE_ENV: process.env.NODE_ENV,
    SLACK_BOT_HOST: process.env.SLACK_BOT_HOST || "0.0.0.0",
    REQUEST_BODY_SIZE_LIMIT: 1024 * 200,

    SLACK_WORKSPACE_ID: process.env.SLACK_WORKSPACE_ID as string,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET as string,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_BOT_PORT: parseInt(process.env.SLACK_BOT_PORT, 10) || 8080,

    OrgSettingsDB: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: +(process.env.DB_PORT ?? 5432),
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_USERNAME: process.env.DB_USERNAME,
        DB_NAME: process.env.DB_NAME
    },


    DIAGNOSTIC_CHANNEL: process.env.DIAGNOSTIC_CHANNEL,
    DEFAULT_CHANNEL_PARTICIPANTS: process.env.DEFAULT_CHANNEL_PARTICIPANTS?.split(",").map(u => u.trim()) || [],


    GITHUB_APP_ID: +process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!.replace(
        /\\n/g,
        "\n"
    ),
    HMAC_SECRET: process.env.HMAC_SECRET as string,

    /*
     * You can implement any other logic depending on the granularity level you need
     * */
    getOpenedPRBroadcastChannel(payload: PullRequestEvent): string | null {
        const projectKey = payload.pullRequest.targetBranch.projectKey;
        let channelName = null;

        if (payload.pullRequest.author.isBotUser) {
            channelName =
                process.env[
                    `${projectKey.toUpperCase()}_BOT_OPENED_PRS_BROADCAST_CHANNEL`
                    ] ?? process.env.BOT_OPENED_PRS_BROADCAST_CHANNEL;
        }
        if (!channelName) {
            channelName =
                process.env[
                    `${projectKey.toUpperCase()}_OPENED_PRS_BROADCAST_CHANNEL`
                    ] ?? process.env.OPENED_PRS_BROADCAST_CHANNEL;
        }
        return channelName ?? null;
    }
};
