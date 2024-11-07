import { GitHubUserPayload } from "../GitHub.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { UserPayload } from "../../../../pr-events-handling/event-contracts";
import { formatUsername } from "./formatUsername";
import { getSlackUserId } from "./getSlackUserId";

export default async function mapGitHubUserToSlackUser(user: GitHubUserPayload, userIdResolver: SlackUserIdResolver): Promise<UserPayload> {
    return {
        name: formatUsername(user),
        slackUserId: await getSlackUserId(userIdResolver, user)
    } as UserPayload
}
