import "reflect-metadata";

import { AppConfig } from "../app.config";
import { App } from "@slack/bolt";
import { LogLevel } from "@slack/logger";
import { renderOrganizationsList } from "./slack-bot-home-page/renderOrganizationsList";
import { SlackActionKeys } from "./SlackActionKeys";
import { renderOrganizationSettingsModal } from "./slack-bot-home-page/renderOrganizationSettingsModal";
import { saveOrganizationSettings } from "./slack-bot-home-page/saveOrganizationSettings";
import { getOrganizationRepositoriesDropdownOptions } from "./slack-bot-home-page/getOrganizationRepositoriesDropdownOptions";

export const slackApp = new App({
    token: AppConfig.SLACK_BOT_TOKEN,
    appToken: AppConfig.SLACK_APP_TOKEN,
    logLevel: AppConfig.IS_PRODUCTION ? LogLevel.WARN : LogLevel.DEBUG,
    socketMode: true
});

slackApp.event("app_home_opened", renderOrganizationsList);
slackApp.action(SlackActionKeys.OPEN_ORGANIZATION_SETTINGS_MODAL, renderOrganizationSettingsModal);
slackApp.view(SlackActionKeys.SAVE_ORGANIZATION_SETTINGS, saveOrganizationSettings);
slackApp.options(SlackActionKeys.GET_REPOSITORIES_TO_EXCLUDE_DROPDOWN_OPTIONS, getOrganizationRepositoriesDropdownOptions);
