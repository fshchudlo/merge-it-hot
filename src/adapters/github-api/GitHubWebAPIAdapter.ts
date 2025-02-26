import axios, { AxiosRequestConfig } from "axios";
import { fetchAccessToken } from "./internals/GitHubCredentialsHelper";
import { GitHubAPI } from "../../web-app/route-handlers/github-webhook/transformGithubPayloadToAppEvent/ports/GitHubAPI";
import { GitHubRepositoriesAPI } from "../../slack-app/slack-bot-home-page/ports/GitHubRepositoriesAPI";

type CommitResponse = {
    commit: {
        message: string;
    };
};

export default class GitHubWebAPIAdapter implements GitHubAPI, GitHubRepositoriesAPI {
    private readonly baseUrl = "https://api.github.com";

    constructor(
        private readonly appId: number,
        private readonly privateKey: string,
        private readonly organizationId: number
    ) {
    }

    async fetchCommitMessage(owner: string, repo: string, commitHash: string) {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${commitHash}`;
        return (await this.executeRequest<CommitResponse>(url)).commit.message;
    }

    async getRepositories(orgName: string): Promise<{ name: string }[]> {
        const url = `${this.baseUrl}/orgs/${orgName}/repos`;
        return await this.getFullList(url);
    }

    fetchFromAPIUrl<T>(apiUrl: string) {
        return this.executeRequest<T>(apiUrl);
    }

    private async getFullList<T>(url: string, params: any = undefined): Promise<T[]> {
        const pageSize = params?.per_page ?? 100;
        const requestParams = {
            page: params?.page ?? 1,
            per_page: pageSize,
            ...params
        };

        const result: any[] = [];
        while (true) {
            const response = await this.executeRequest<T[]>(url, requestParams);

            result.push(...response);

            if (response.length < pageSize)
                break;
            requestParams.page++;
        }
        return result;
    }

    private async executeRequest<T>(
        url: string,
        params: AxiosRequestConfig["params"] = null
    ) {
        const accessToken = await fetchAccessToken(
            this.appId,
            this.privateKey,
            this.organizationId
        );
        const config: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json"
            },
            params
        };
        const response = await axios.get<T>(url, config);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(
            `Error executing request for ${url} message: ${response.statusText}`
        );
    }
}
