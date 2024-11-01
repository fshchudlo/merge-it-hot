import { BitbucketUserPayload } from "../Bitbucket.contracts";
import { SlackUserIdResolver } from "../../SlackUserIdResolver";
import { UserPayload } from "../../../../pr-events-handling/event-contracts";

export async function normalizeUserPayload(user: BitbucketUserPayload, slackUserIdResolver: SlackUserIdResolver): Promise<UserPayload> {
    const userId = await slackUserIdResolver.getUserId(user.emailAddress);
    return {
        name: user.displayName,
        slackUserId: userId
    };
}