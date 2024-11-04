import GitHubAPI from "../GitHubAPI";
import { AppConfig } from "../../app.config";

describe.skip("GitHubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it("should return a list of installations", async () => {
        const api = new GitHubAPI(AppConfig.GITHUB_APP_ID, AppConfig.GITHUB_APP_PRIVATE_KEY, AppConfig.GITHUB_APP_INSTALLATION_ID);
        const installations = await api.getAppInstallations();
        expect(installations).not.toHaveLength(0);
    });
});