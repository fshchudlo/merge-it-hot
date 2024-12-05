import axios, { AxiosRequestConfig } from "axios";
import { fetchAccessToken } from "./GitHubCredentialsHelper";
import { GitHubAPI } from "../../github-payload-to-event-mapping/GitHubAPI.port";

type CommitResponse = {
    commit: {
        message: string;
    };
};

export default class GitHubWebAPIAdapter implements GitHubAPI {
    private readonly baseUrl = "https://api.github.com";

    constructor(
        private readonly appId: number,
        private readonly privateKey: string,
        private readonly organizationId: number,
    ) {}

    private async executeRequest<T>(
        url: string,
        params: AxiosRequestConfig["params"] = null,
    ) {
        const accessToken = await fetchAccessToken(
            this.appId,
            this.privateKey,
            this.organizationId,
        );
        const config: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
            params,
        };
        const response = await axios.get<T>(url, config);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(
            `Error executing request for ${url} message: ${response.statusText}`,
        );
    }

    async fetchCommitMessage(owner: string, repo: string, commitHash: string) {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${commitHash}`;
        return (await this.executeRequest<CommitResponse>(url)).commit.message;
    }

    fetchFromAPIUrl<T>(apiUrl: string) {
        return this.executeRequest<T>(apiUrl);
    }
}
