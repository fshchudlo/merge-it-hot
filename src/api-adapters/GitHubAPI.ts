import jwt from "jsonwebtoken";
import axios, { AxiosRequestConfig } from "axios";

let cachedToken: string | null = null;
let tokenExpirationDate: number | null = null;
export const generateAppJWT = (appId: string, privateKey: string): string => {
    const payload = {
        iss: appId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60) // JWT expires after 10 minutes
    };
    return jwt.sign(payload, privateKey, { algorithm: "RS256" });
};
export const getInstallationAccessToken = async (appId: string, privateKey: string, installationId: string): Promise<string> => {
    if (cachedToken && tokenExpirationDate && Date.now() <= tokenExpirationDate) {
        return cachedToken;
    }
    const jwtToken = generateAppJWT(appId, privateKey);
    const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
    const response = await axios.post(url, {}, {
        headers: {
            Authorization: `Bearer ${jwtToken}`,
            Accept: "application/vnd.github.v3+json"
        }
    });
    // Set expiration time to 1 hour from now (GitHub tokens are valid for 1 hour)
    tokenExpirationDate = Date.now() + 60 * 60 * 1000;
    cachedToken = response.data.token;
    return cachedToken;
};

export default class GitHubAPI {
    private readonly baseUrl = "https://api.github.com";
    private readonly appId: string;
    private readonly privateKey: string;
    private readonly installationId: string;

    constructor(appId: string, privateKey: string, installationId: string) {
        this.appId = appId;
        this.privateKey = privateKey;
        this.installationId = installationId;
    }

    private async executeRequest<T>(url: string, params: any = undefined): Promise<T | null> {
        const accessToken = await getInstallationAccessToken(this.appId, this.privateKey, this.installationId);
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

    canRead(): boolean {
        return true;
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