import { SlackUserIdResolver } from "../../ports/SlackUserIdResolver";
import { GitHubUserPayload } from "../../GitHubAPI.contracts";

export async function getSlackUserId(userIdResolver: SlackUserIdResolver, user: GitHubUserPayload): Promise<string> {
    if (user.type === "Mannequin") {
        console.warn(`The user is mannequin, skipping searching him in Slack`);
        return null;
    }
    if (user.type === "Bot") {
        return null;
    }
    const userId = await userIdResolver.getUserId(getUserEmailFromGitHubLogin(user.login));
    if (!userId) {
        console.warn(`Could not find Slack user "${user.login}" by email. Returning login instead of Slack User Id`);
        return getUserNameFromGitHubLogin(user.login);
    }
    return userId;
}

/*
 * Gets the user login in the format "john-doe_company name" and returns "john.doe@companyname.com"
 * */
export function getUserEmailFromGitHubLogin(login: string): string {
    if (login.includes("@")) {
        return login;
    }
    const [namePart, companyName] = login.split("_");

    const formattedName = namePart.replace("-", ".");

    return `${formattedName}@${companyName}.com`;
}

export function getUserNameFromGitHubLogin(login: string): string {
    return login.split("_")[0].replace("-", ".");
}
