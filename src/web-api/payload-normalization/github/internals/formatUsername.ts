/*
* Gets the user login in the format "john-doe_company name" and returns "John Doe"
* */
import { GitHubUserPayload } from "../GitHub.contracts";

export function formatUsername(user: GitHubUserPayload) {
    if (user.type === "Mannequin") {
        return user.html_url.replace("https://github.com/", "");
    }

    const namePart = user.login.split("_")[0];

    const [firstName, lastName] = namePart.split("-");

    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    return `${formattedFirstName} ${formattedLastName}`;
}