import { AppHomeOpenedEvent } from "@slack/types/dist/events/app";
import { AllMiddlewareArgs } from "@slack/bolt";
import { OrganizationSettingsProvider } from "../../api-adapters/organization-settings/OrganizationSettingsProvider";
import { AppConfig } from "../../app.config";
import { ActionKeys } from "../ActionKeys";
import { button, divider, header, section } from "@slack-building-blocks";

export async function renderOrganizationsList({ event, client }: { event: AppHomeOpenedEvent } & AllMiddlewareArgs) {
    if (event.tab != "home") {
        return;
    }
    try {
        const settings = await OrganizationSettingsProvider.provisionAllFromGithubInstallations(
            AppConfig.SLACK_WORKSPACE_ID,
            AppConfig.GITHUB_APP_ID,
            AppConfig.GITHUB_APP_PRIVATE_KEY
        );
        await client.views.publish({
            user_id: event.user,
            view: {
                type: "home",
                blocks: [
                    header("Configure your preferences for the GitHub Organizations below:"),
                    ...settings
                        .flatMap(organizationSettings => {
                            return [
                                divider(),
                                {
                                    ...section(`*${organizationSettings.githubOrganizationLogin}*`),
                                    accessory: button("Configure", ActionKeys.OPEN_ORGANIZATION_SETTINGS_MODAL, `${organizationSettings.githubOrganizationId}`)
                                }
                            ];
                        })
                ]
            }
        });
    } catch (error) {
        console.error(error);
    }
}