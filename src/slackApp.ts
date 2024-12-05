import "reflect-metadata";

import { AppConfig } from "./app.config";
import { App } from "@slack/bolt";
import { OrganizationSettingsProvider } from "./api-adapters/organization-settings/OrganizationSettingsProvider";
import { OrganizationSettings } from "./api-adapters/organization-settings/entities/OrganizationSettings";
import { LogLevel } from "@slack/logger";
import { ModalView } from "@slack/types";
import { section } from "@slack-building-blocks";
import { renderOrganizationSettingsList } from "./slack-actions/slack-bot-home-page/renderOrganizationSettingsList";
import { ActionKeys } from "./slack-actions/actionKeys";


export const slackApp = new App({
    token: AppConfig.SLACK_BOT_TOKEN,
    appToken: AppConfig.SLACK_APP_TOKEN,
    logLevel: AppConfig.IS_PRODUCTION ? LogLevel.WARN : LogLevel.DEBUG,
    socketMode: true
});


slackApp.event("app_home_opened", renderOrganizationSettingsList);

slackApp.action(ActionKeys.OPEN_ORGANIZATION_SETTINGS_MODAL, async ({ ack, body }: any) => {
    await ack();
    const organizationSettings = await OrganizationSettingsProvider.findByKey(body.team_id, body.actions[0].value);
    await slackApp.client.views.open({
        trigger_id: body.trigger_id,
        view: buildOrganizationSettingsModalForm(organizationSettings)
    });
});

slackApp.view(/save_organization_settings-\d+/, async ({ ack, body, view }: any) => {
    const respond = async (title: string, ...blocks: any[]): Promise<void> => {
        await ack({
            response_action: "update",
            view: {
                type: "modal",
                title: { type: "plain_text", text: title },
                blocks: blocks
            }
        });
    };

    const organizationId = view.callback_id.split("-")[1];
    const updatedValues = Object.values(body.view.state.values).flatMap(block => Object.entries(block))
        .reduce((accumulator: any, fieldEntry: any) => {
            accumulator[fieldEntry[0]] = fieldEntry[1].selected_users || fieldEntry[1].selected_channel || null;
            return accumulator;
        }, {});
    await OrganizationSettingsProvider.update(body.team.id, organizationId, updatedValues);
    await respond("Success", section(":thumbsup: Organization settings updated successfully."));
});


function buildOrganizationSettingsModalForm(organizationSettings: OrganizationSettings): ModalView {
    const actionId = organizationSettings.githubOrganizationId;
    return {
        type: "modal",
        callback_id: `save_organization_settings-${actionId}`,
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