import axios, { AxiosRequestConfig } from "axios";
import { fetchAccessToken } from "./GitHubCredentialsHelper";

export default class GitHubAPI {
    private readonly baseUrl = "https://api.github.com";
    private readonly appId: number;
    private readonly privateKey: string;
    private readonly organizationId: number;

    constructor(appId: number, privateKey: string, organizationId: number) {
        this.appId = appId;
        this.privateKey = privateKey;
        this.organizationId = organizationId;
    }

    private async executeRequest<T>(url: string, params: any = undefined): Promise<T | null> {
        const accessToken = await fetchAccessToken(this.appId, this.privateKey, this.organizationId);
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
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

    async fetchCommitMessage(owner: string, repo: string, commitHash: string): Promise<string | null> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${commitHash}`;
        return (await this.executeRequest<CommitResponse>(url)).commit.message;
    }

    async fetchFromAPIUrl<T>(apiUrl: string): Promise<T | null> {
        return await this.executeRequest<T>(apiUrl);
    }
}

declare type CommitResponse = {
    commit: {
        message: string;
    };
};
