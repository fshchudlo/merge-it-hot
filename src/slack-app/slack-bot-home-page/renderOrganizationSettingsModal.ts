import { OrganizationSettingsProvider } from "../../adapters/organization-settings-provider/OrganizationSettingsProvider";
import { slackApp } from "../slackApp";
import { OrganizationSettings } from "../../adapters/organization-settings-provider/entities/OrganizationSettings";
import { ModalView } from "@slack/types";
import { SlackActionKeys } from "../SlackActionKeys";
import { bold, contextBlock, plainText } from "@slack-building-blocks";
import { GithubRepositoriesCache } from "./internals/GithubRepositoriesCache";
import createOrganizationGitHubAPI from "./internals/createOrganizationGitHubAPI";


export async function renderOrganizationSettingsModal({ ack, body }: any) {
    await ack();
    const organizationSettings = await OrganizationSettingsProvider.findByKey(body.team_id, body.actions[0].value);

    /*Precache values as this request can be time-consuming for large organizations.
    The Slack API has low tolerance for prolonged operations, so caching helps prevent timeouts.
     */
    GithubRepositoriesCache.fetchOrganizationRepositories(
        organizationSettings.githubOrganizationLogin,
        createOrganizationGitHubAPI(organizationSettings.githubOrganizationId)
    ).then(() => {
    });

    await slackApp.client.views.open({
        trigger_id: body.trigger_id,
        view: buildOrganizationSettingsModalForm(organizationSettings)
    });
}

function buildOrganizationSettingsModalForm(organizationSettings: OrganizationSettings): ModalView {
    return {
        type: "modal",
        callback_id: SlackActionKeys.SAVE_ORGANIZATION_SETTINGS,
        title: plainText("Configure Organization"),
        private_metadata: organizationSettings.githubOrganizationId + "",
        submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
        },
        blocks: [
            {
                type: "input",
                block_id: `defaultChannelParticipants`,
                label: plainText("Default PR Channel Participants"),
                element: {
                    type: "multi_users_select",
                    action_id: `defaultChannelParticipants`,
                    placeholder: plainText("Select users"),
                    initial_users: organizationSettings.defaultChannelParticipants || []
                },
                optional: true
            },
            contextBlock("Users to add to each PR channel in addition to those already assigned as reviewers."),
            {
                type: "input",
                block_id: `openedPRsBroadcastChannel`,
                label: plainText("Opened PRs Broadcast Channel"),
                element: {
                    type: "channels_select",
                    action_id: `openedPRsBroadcastChannel`,
                    placeholder: plainText("Select a channel"),
                    initial_channel: organizationSettings.openedPRsBroadcastChannel || undefined
                },
                optional: true
            },
            contextBlock("The channel for broadcasting messages about opened PRs, keeping your team informed about all opened PRs."),
            {
                type: "input",
                block_id: `openedBotPRsBroadcastChannel`,
                label: plainText("Opened Bot PRs Broadcast Channel"),
                element: {
                    type: "channels_select",
                    action_id: `openedBotPRsBroadcastChannel`,
                    placeholder: plainText("Select a channel"),
                    initial_channel: organizationSettings.openedBotPRsBroadcastChannel || undefined
                },
                optional: true
            },
            contextBlock(`The channel for broadcasting messages about PRs opened ${bold("only by bots")}.`),
            {
                type: "input",
                block_id: "external_select_block",
                label: plainText("Repositories to exclude from processing"),
                element: {
                    type: "multi_external_select",
                    action_id: SlackActionKeys.GET_REPOSITORIES_TO_EXCLUDE_DROPDOWN_OPTIONS,
                    placeholder: plainText("Type at least 3 symbols..."),
                    min_query_length: 3,
                    initial_options: organizationSettings.repositoriesToExclude
                        .map(r => ({ text: plainText(r), value: r })) || []
                },
                optional: true
            },
            contextBlock(`Repositories from which you ${bold("do not want")} to receive PR notifications.`)
        ]
    };
}