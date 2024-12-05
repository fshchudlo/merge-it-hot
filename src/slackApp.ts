import "reflect-metadata";

import { AppConfig } from "./app.config";
import { App } from "@slack/bolt";
import { LogLevel } from "@slack/logger";
import { renderOrganizationsList } from "./slack-actions/slack-bot-home-page/renderOrganizationsList";
import { ActionKeys } from "./slack-actions/ActionKeys";
import { renderOrganizationSettingsModal } from "./slack-actions/slack-bot-home-page/renderOrganizationSettingsModal";
import { saveOrganizationSettings } from "./slack-actions/slack-bot-home-page/saveOrganizationSettings";


export const slackApp = new App({
    token: AppConfig.SLACK_BOT_TOKEN,
    appToken: AppConfig.SLACK_APP_TOKEN,
    logLevel: AppConfig.IS_PRODUCTION ? LogLevel.WARN : LogLevel.DEBUG,
    socketMode: true
});

slackApp.event("app_home_opened", renderOrganizationsList);
slackApp.action(ActionKeys.OPEN_ORGANIZATION_SETTINGS_MODAL, renderOrganizationSettingsModal);
slackApp.view(new RegExp(`${ActionKeys.SAVE_ORGANIZATION_SETTINGS_PREFIX}\\d+`), saveOrganizationSettings);
