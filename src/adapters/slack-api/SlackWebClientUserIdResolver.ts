import * as slack from "@slack/web-api";
import { USERIDS_CACHE } from "./internals/cache/USERIDS_CACHE";
import { SlackUserIdResolver } from "../../web-app/route-handlers/github-webhook/transformGithubPayloadToAppEvent/ports/SlackUserIdResolver";

export class SlackWebClientUserIdResolver implements SlackUserIdResolver {
    constructor(private readonly client: slack.WebClient) {}

    async getUserId(email: string): Promise<string | null> {
        const cachedUserId = await USERIDS_CACHE.get(email);
        if (cachedUserId) {
            return Promise.resolve(cachedUserId);
        }
        const user = await this.client.users
            .lookupByEmail({ email })
            .catch(e => (e.data?.error == "users_not_found" ? undefined : e));

        const userId = user?.user?.id;

        if (!userId) {
            return null;
        }
        await USERIDS_CACHE.set(email, userId);
        return userId;
    }
}
