import { OrganizationSettings } from "./entities/OrganizationSettings";
import { OrgSettingsDB } from "./OrgSettingsDB";
import { Repository } from "typeorm";
import { createCache } from "cache-manager";
import { getAppInstallations } from "../github-api/internals/GitHubCredentialsHelper";

const settingsRepository: Repository<OrganizationSettings> = OrgSettingsDB.getRepository(OrganizationSettings);
const settingsCache: ReturnType<typeof createCache> = createCache();

export class OrganizationSettingsProvider {
    public static async fetch(slackWorkspaceId: string, githubOrganizationId: number, githubOrganizationLogin: string): Promise<OrganizationSettings> {
        const cacheKey = this.getCacheKey(slackWorkspaceId, githubOrganizationId);

        return await settingsCache.wrap(cacheKey, async () => {
            let settings = await settingsRepository.findOne({ where: { slackWorkspaceId, githubOrganizationId } });

            if (settings) {
                return settings;
            }

            settings = settingsRepository.create({
                slackWorkspaceId,
                githubOrganizationId,
                githubOrganizationLogin,
                defaultChannelParticipants: [],
                openedBotPRsBroadcastChannel: null,
                openedPRsBroadcastChannel: null,
                repositoriesToExclude: []
            });

            await settingsRepository.save(settings);
            return settings;
        });
    }

    static async provisionAllFromGithubInstallations(slackWorkspaceId: string, githubAppId: number, githubPrivateKey: string) {
        const installations = await getAppInstallations(githubAppId, githubPrivateKey);
        await Promise.all(
            installations.map(installation =>
                OrganizationSettingsProvider.fetch(slackWorkspaceId, installation.organizationId, installation.organizationLogin)
            )
        );
        return await settingsRepository.find({ where: { slackWorkspaceId }, order: { githubOrganizationLogin: "ASC" } });
    }

    static async findByKey(slackWorkspaceId: string, githubOrganizationId: number) {
        return await settingsRepository.findOne({ where: { slackWorkspaceId, githubOrganizationId } });
    }

    static async update(slackWorkspaceId: string, githubOrganizationId: number, settings: Partial<OrganizationSettings>) {
        const dbSettings = await settingsRepository.findOne({ where: { slackWorkspaceId, githubOrganizationId } });
        dbSettings.defaultChannelParticipants = settings.defaultChannelParticipants || [];
        dbSettings.repositoriesToExclude = settings.repositoriesToExclude || [];
        dbSettings.openedPRsBroadcastChannel = settings.openedPRsBroadcastChannel;
        dbSettings.openedBotPRsBroadcastChannel = settings.openedBotPRsBroadcastChannel;
        await settingsRepository.save(dbSettings);
        await settingsCache.del(this.getCacheKey(slackWorkspaceId, githubOrganizationId));
    }

    private static getCacheKey(slackWorkspaceId: string, githubOrganizationId: number) {
        return `${slackWorkspaceId}-${githubOrganizationId}`;
    }
}