import { createCache } from "cache-manager";
import { GitHubRepositoriesAPI } from "../ports/GitHubRepositoriesAPI";

const repositoriesCache: ReturnType<typeof createCache> = createCache({
    ttl: 3 * 60 * 1000
});

export class GithubRepositoriesCache {
    static async fetchOrganizationRepositories(orgName: string, gitHubAPI: GitHubRepositoriesAPI) {
        return repositoriesCache.wrap<{ name: string }[]>(
            `organizationRepositories:${orgName}`,
            async () => {
                return gitHubAPI.getRepositories(orgName);
            }
        );
    }
}