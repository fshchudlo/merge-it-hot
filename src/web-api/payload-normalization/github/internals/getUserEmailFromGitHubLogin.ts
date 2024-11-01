/*
* Gets the user login in the format "john-doe_company name" and returns "john.doe@companyname.com"
* */
export function getUserEmailFromGitHubLogin(login: string): string {
    const [namePart, companyName] = login.split("_");

    const formattedName = namePart.replace("-", ".");

    return `${formattedName}@${companyName}.com`;
}