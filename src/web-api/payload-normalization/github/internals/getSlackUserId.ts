import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { GitHubUserPayload } from "../GitHub.contracts";

export async function getSlackUserId(userIdResolver: SlackUserIdResolver, user: GitHubUserPayload): Promise<string> {
    if (user.type === "Mannequin") {
        console.warn(`The user is mannequin, skiping searching him in Slack`);
        return null;
    }
    const userId = await userIdResolver.getUserId(getUserEmailFromGitHubLogin(user.login));
    if (!userId) {
        console.warn(`Could not find Slack user for the login ${user.login}`);
    }
    return userId;
}

/*
* Gets the user login in the format "john-doe_company name" and returns "john.doe@companyname.com"
* */
export function getUserEmailFromGitHubLogin(login: string): string {
    const [namePart, companyName] = login.split("_");

    const formattedName = namePart.replace("-", ".");

    return `${formattedName}@${companyName}.com`;
}