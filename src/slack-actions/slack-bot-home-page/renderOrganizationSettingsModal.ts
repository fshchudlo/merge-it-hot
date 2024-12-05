import { OrganizationSettingsProvider } from "../../api-adapters/organization-settings/OrganizationSettingsProvider";
import { slackApp } from "../../slackApp";
import { OrganizationSettings } from "../../api-adapters/organization-settings/entities/OrganizationSettings";
import { ModalView } from "@slack/types";
import { ActionKeys } from "../ActionKeys";
import { plainText } from "@slack-building-blocks";


export async function renderOrganizationSettingsModal({ ack, body }: any) {
    await ack();
    const organizationSettings = await OrganizationSettingsProvider.findByKey(body.team_id, body.actions[0].value);
    await slackApp.client.views.open({
        trigger_id: body.trigger_id,
        view: buildOrganizationSettingsModalForm(organizationSettings)
    });
}

function buildOrganizationSettingsModalForm(organizationSettings: OrganizationSettings): ModalView {
    return {
        type: "modal",
        callback_id: ActionKeys.SAVE_ORGANIZATION_SETTINGS,
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
            {
                type: "input",
                block_id: "external_select_block",
                label: plainText("Repositories to exclude from processing"),
                element: {
                    type: "multi_external_select",
                    action_id: ActionKeys.GET_REPOSITORIES_TO_EXCLUDE_DROPDOWN_OPTIONS,
                    placeholder: plainText("Type at least 3 symbols..."),
                    min_query_length: 3,
                    initial_options: organizationSettings.repositoriesToExclude
                        .map(r => ({ text: plainText(r), value: r })) || []
                },
                optional: true
            }
        ]
    };
}