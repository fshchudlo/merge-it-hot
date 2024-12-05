import { OrganizationSettingsProvider } from "../../api-adapters/organization-settings/OrganizationSettingsProvider";
import { slackApp } from "../../slackApp";
import { OrganizationSettings } from "../../api-adapters/organization-settings/entities/OrganizationSettings";
import { ModalView } from "@slack/types";
import { ActionKeys } from "../ActionKeys";

export async function renderOrganizationSettingsModal({ ack, body }: any) {
    await ack();
    const organizationSettings = await OrganizationSettingsProvider.findByKey(body.team_id, body.actions[0].value);
    await slackApp.client.views.open({
        trigger_id: body.trigger_id,
        view: buildOrganizationSettingsModalForm(organizationSettings)
    });
}

function buildOrganizationSettingsModalForm(organizationSettings: OrganizationSettings): ModalView {
    const actionId = organizationSettings.githubOrganizationId;
    return {
        type: "modal",
        callback_id: `${ActionKeys.SAVE_ORGANIZATION_SETTINGS_PREFIX}${actionId}`,
        title: {
            type: "plain_text",
            text: "Configure Organization"
        },
        submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
        },
        blocks: [
            {
                type: "input",
                block_id: `defaultChannelParticipants`,
                label: {
                    type: "plain_text",
                    text: "Default PR Channel Participants"
                },
                element: {
                    type: "multi_users_select",
                    action_id: `defaultChannelParticipants`,
                    placeholder: {
                        type: "plain_text",
                        text: "Select users"
                    },
                    initial_users: organizationSettings.defaultChannelParticipants || []
                },
                optional: true
            },
            {
                type: "input",
                block_id: `openedPRsBroadcastChannel`,
                label: {
                    type: "plain_text",
                    text: "Opened PRs Broadcast Channel"
                },
                element: {
                    type: "channels_select",
                    action_id: `openedPRsBroadcastChannel`,
                    placeholder: {
                        type: "plain_text",
                        text: "Select a channel"
                    },
                    initial_channel: organizationSettings.openedPRsBroadcastChannel || undefined
                },
                optional: true
            },
            {
                type: "input",
                block_id: `openedBotPRsBroadcastChannel`,
                label: {
                    type: "plain_text",
                    text: "Opened Bot PRs Broadcast Channel"
                },
                element: {
                    type: "channels_select",
                    action_id: `openedBotPRsBroadcastChannel`,
                    placeholder: {
                        type: "plain_text",
                        text: "Select a channel"
                    },
                    initial_channel: organizationSettings.openedBotPRsBroadcastChannel || undefined
                },
                optional: true
            }
        ]
    };
}