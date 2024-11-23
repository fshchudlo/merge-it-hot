import { GitHubUserPayload } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../SlackUserIdResolver";
import { UserPayload } from "../../event-handlers/event-contracts";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";

export default async function mapGitHubUserToSlackUser(user: GitHubUserPayload, userIdResolver: SlackUserIdResolver): Promise<UserPayload> {
    return {
        name: formatUsername(user),
        isBotUser: user.type === "Bot",
        slackUserId: await getSlackUserId(userIdResolver, user)
    } as UserPayload
}
