export interface GitHubAPI {
    fetchCommitMessage(owner: string, repo: string, commitHash: string): Promise<any>;

    fetchFromAPIUrl<T>(apiUrl: string): Promise<T>;
}
