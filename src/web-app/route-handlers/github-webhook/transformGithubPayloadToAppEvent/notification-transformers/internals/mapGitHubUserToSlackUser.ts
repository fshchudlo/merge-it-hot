import { GitHubUserPayload } from "../../GitHubAPI.contracts";
import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { UserPayload } from "../../../../../notification-handlers/event-contracts";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";

export default async function mapGitHubUserToSlackUser(user: GitHubUserPayload, userIdResolver: SlackUserIdResolver): Promise<UserPayload> {
    return {
        name: formatUsername(user),
        isBotUser: user.type === "Bot",
        slackUserId: await getSlackUserId(userIdResolver, user)
    } as UserPayload;
}
