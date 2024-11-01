import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { getUserEmailFromGitHubLogin } from "./getUserEmailFromGitHubLogin";

export async function getSlackUserId(userIdResolver: SlackUserIdResolver, login: string): Promise<string> {
    const userId = await userIdResolver.getUserId(getUserEmailFromGitHubLogin(login));
    if (!userId) {
        console.warn(`Could not find Slack user for the login ${login}`);
    }
    return userId;
}