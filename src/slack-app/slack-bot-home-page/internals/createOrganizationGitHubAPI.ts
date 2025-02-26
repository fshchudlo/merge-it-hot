import { GitHubRepositoriesAPI } from "../ports/GitHubRepositoriesAPI";
import GitHubWebAPIAdapter from "../../../adapters/github-api/GitHubWebAPIAdapter";
import { AppConfig } from "../../../app.config";

export default function createOrganizationGitHubAPI(organizationId: number): GitHubRepositoriesAPI {
    return new GitHubWebAPIAdapter(AppConfig.GITHUB_APP_ID, AppConfig.GITHUB_APP_PRIVATE_KEY, organizationId);
}
