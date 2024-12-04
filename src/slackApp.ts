import "reflect-metadata";

import { AppConfig } from "./app.config";
import { App } from "@slack/bolt";
import { OrganizationSettingsProvider } from "./api-adapters/organization-settings/OrganizationSettingsProvider";
import { OrganizationSettings } from "./api-adapters/organization-settings/entities/OrganizationSettings";
import { LogLevel } from "@slack/logger";


export const slackApp = new App({
    token: AppConfig.SLACK_BOT_TOKEN,
    appToken: AppConfig.SLACK_APP_TOKEN,
    logLevel: AppConfig.IS_PRODUCTION ? LogLevel.WARN : LogLevel.DEBUG,
    socketMode: true
});

slackApp.event("app_home_opened", async ({ event, client }) => {
        if (event.tab != "home") {
            return;
        }
        try {
            const settings = await OrganizationSettingsProvider.getSettingsForWorkspace((<any>event.view).team_id);
            await client.views.publish({
                user_id: event.user,
                view: {
                    type: "home",
                    blocks: [
                        {
                            type: "header",
                            text: {
                                type: "plain_text",
                                text: `Configure your preferences for the GitHub Organizations below:`,
                                emoji: true
                            }
                        },
                        ...settings.flatMap(setting => generateOrgSettingsControls(setting))
                    ]
                }
            });
        } catch (error) {
            console.error(error);
        }
    }
);

const generateOrgSettingsControls = (organizationSettings: OrganizationSettings) => {
    const actionId = organizationSettings.githubOrganizationId;
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${organizationSettings.githubOrganizationLogin}*`
            }
        },
        {
            type: "divider"
        },
        {
            type: "input",
            block_id: `defaultChannelParticipants_${actionId}`,
            label: {
                type: "plain_text",
                text: "Default PR Channel Participants"
            },
            element: {
                type: "multi_users_select",
                action_id: `defaultChannelParticipants_action_${actionId}`,
                placeholder: {
                    type: "plain_text",
                    text: "Select users"
                },
                initial_users: organizationSettings.defaultChannelParticipants || []
            }
        },
        {
            type: "input",
            block_id: `openedPRsBroadcastChannel_${actionId}`,
            label: {
                type: "plain_text",
                text: "Opened PRs Broadcast Channel"
            },
            element: {
                type: "channels_select",
                action_id: `openedPRsBroadcastChannel_action_${actionId}`,
                placeholder: {
                    type: "plain_text",
                    text: "Select a channel"
                },
                initial_channel: organizationSettings.openedPRsBroadcastChannel || undefined
            }
        },
        {
            type: "input",
            block_id: `openedBotPRsBroadcastChannel_${actionId}`,
            label: {
                type: "plain_text",
                text: "Opened Bot PRs Broadcast Channel"
            },
            element: {
                type: "channels_select",
                action_id: `openedBotPRsBroadcastChannel_action_${actionId}`,
                placeholder: {
                    type: "plain_text",
                    text: "Select a channel"
                },
                initial_channel: organizationSettings.openedBotPRsBroadcastChannel || undefined
            }
        },
        {
            type: "actions",
            block_id: `save_button_${actionId}`,
            elements: [
                {
                    type: "button",
                    action_id: `save_organization_settings`,
                    text: {
                        type: "plain_text",
                        text: "Save"
                    },
                    style: "primary",
                    value: `${actionId}`
                }
            ]
        }
    ];
};

slackApp.action("save_organization_settings", async ({ ack, body }: any) => {
    await ack();
    const organizationId = body.actions[0].value;
    const form = Object.keys(body.view.state.values)
        .filter((k: string) => k.endsWith(organizationId))
        .reduce((accumulator: any, blockKey: string) => {
            Object.keys(body.view.state.values[blockKey])
                .filter((k: string) => k.endsWith(organizationId))
                .forEach((actionKey: string) => accumulator[actionKey.replace(`_action_${organizationId}`, "")] = body.view.state.values[blockKey][actionKey]);
            return accumulator;
        }, {});
    console.log("Action Payload:", JSON.stringify(form, null, 2));
});