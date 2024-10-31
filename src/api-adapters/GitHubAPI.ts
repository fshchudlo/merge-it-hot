import axios, { AxiosRequestConfig } from "axios";

export default class GitHubAPI {
    private readonly baseUrl = "https://api.github.com";
    private readonly readApiToken: string;

    constructor(readApiToken: string | null) {
        this.readApiToken = readApiToken;
    }

    private async executeRequest<T>(url: string, params: any = undefined): Promise<T | null> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `token ${this.readApiToken}`,
                "Accept": "application/vnd.github.v3+json"
            },
            params: params
        };
        const response = await axios.get(url, config);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Error executing request for ${url} message: ${response.statusText}`);
    }

    canRead(): boolean {
        return !!this.readApiToken;
    }

    async fetchCommitMessage(owner: string, repo: string, commitHash: string): Promise<string | null> {
        if (!this.canRead()) {
            return null;
        }
        const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${commitHash}`;
        return (await this.executeRequest<GetCommitResponse>(url)).commit.message;
    }

    async fetchFromAPIUrl<T>(apiUrl: string): Promise<T | null> {
        if (!this.canRead()) {
            return null;
        }
        return await this.executeRequest<T>(apiUrl);
    }
}
declare type GetCommitResponse = {
    commit: {
        message: string;
    };
};