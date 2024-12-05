import { SlackOptionsMiddlewareArgs } from "@slack/bolt";
import GitHubWebAPIAdapter from "../../api-adapters/github-api/GitHubWebAPIAdapter";
import { AppConfig } from "../../app.config";
import { OrganizationSettingsProvider } from "../../api-adapters/organization-settings/OrganizationSettingsProvider";
import { PlainTextOption } from "@slack/types";

export async function getOrganizationRepositoriesDropdownOptions({ options, ack, body }: SlackOptionsMiddlewareArgs<"block_suggestion">) {
    try {
        const userInput = options.value || "";
        const organizationId = +body.view.private_metadata;
        const workspaceId = body.team.id;

        const organization = await OrganizationSettingsProvider.findByKey(workspaceId, organizationId);

        const githubAPI = new GitHubWebAPIAdapter(
            AppConfig.GITHUB_APP_ID,
            AppConfig.GITHUB_APP_PRIVATE_KEY,
            organizationId
        );

        const repositories = (await githubAPI.getRepositories(organization.githubOrganizationLogin))
            .filter(repo => repo.name.toLowerCase().includes(userInput.toLowerCase()))
            .map(repo => ({
                text: {
                    type: "plain_text",
                    text: repo.name
                },
                value: repo.name
            } as PlainTextOption));

        await ack({ options: repositories });
    } catch (error) {
        console.error("Error handling options request:", error);
    }
}