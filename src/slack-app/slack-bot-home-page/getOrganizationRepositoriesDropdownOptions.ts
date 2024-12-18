import { SlackOptionsMiddlewareArgs } from "@slack/bolt";
import { OrganizationSettingsProvider } from "../../adapters/organization-settings-provider/OrganizationSettingsProvider";
import { PlainTextOption } from "@slack/types";
import { GithubRepositoriesCache } from "./internals/GithubRepositoriesCache";
import createOrganizationGitHubAPI from "./internals/createOrganizationGitHubAPI";

export async function getOrganizationRepositoriesDropdownOptions({ options, ack, body }: SlackOptionsMiddlewareArgs<"block_suggestion">) {
    try {
        const userInput = options.value || "";
        const organizationId = +body.view.private_metadata;
        const workspaceId = body.team.id;

        const organization = await OrganizationSettingsProvider.findByKey(workspaceId, organizationId);

        const allRepositories = await GithubRepositoriesCache.fetchOrganizationRepositories(organization.githubOrganizationLogin, createOrganizationGitHubAPI(organizationId));

        const repositories = allRepositories
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