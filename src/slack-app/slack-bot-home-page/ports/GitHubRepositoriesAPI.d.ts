export interface GitHubRepositoriesAPI {
    getRepositories(orgName: string): Promise<{ name: string }[]>;
}