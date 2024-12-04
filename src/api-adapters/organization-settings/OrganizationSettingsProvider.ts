import { OrganizationSettings } from "./entities/OrganizationSettings";
import { OrgSettingsDB } from "./OrgSettingsDB";
import { Repository } from "typeorm";
import { createCache } from "cache-manager";
import { getAppInstallations } from "../github-api/GitHubCredentialsHelper";

const settingsRepository: Repository<OrganizationSettings> = OrgSettingsDB.getRepository(OrganizationSettings);
const settingsCache: ReturnType<typeof createCache> = createCache();

export class OrganizationSettingsProvider {
    public static async fetch(slackWorkspaceId: string, githubOrganizationId: number, githubOrganizationLogin: string): Promise<OrganizationSettings> {
        const cacheKey = `${slackWorkspaceId}-${githubOrganizationId}`;

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

    static async provisionFromGithubInstallations(slackWorkspaceId: string, githubAppId: number, githubPrivateKey: string) {
        const installations = await getAppInstallations(githubAppId, githubPrivateKey);
        for (const installation of installations) {
            await OrganizationSettingsProvider.fetch(slackWorkspaceId, installation.organizationId, installation.organizationLogin);
        }
    }

    static async getSettingsForWorkspace(slackWorkspaceId: string) {
        return await settingsRepository.find({ where: { slackWorkspaceId } });
    }
}