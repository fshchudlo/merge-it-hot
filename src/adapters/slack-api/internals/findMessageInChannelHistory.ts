import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import * as slack from "@slack/web-api";

export async function findMessageInChannelHistory(
    client: slack.WebClient,
    channelId: string,
    matchPredicate: (message: MessageElement) => boolean,
    oldestDate: Date | undefined = undefined
): Promise<MessageElement | null> {
    let cursor: string;
    const slackTimestamp = oldestDate
        ? Math.floor(oldestDate.getTime() / 1000) + ".000000"
        : undefined;

    while (true) {
        // noinspection JSUnusedAssignment
        const response = await client.conversations.history({
            channel: channelId,
            include_all_metadata: true,
            oldest: slackTimestamp,
            inclusive: true,
            cursor
        });

        const message = response.messages.find(matchPredicate);
        if (message) return message;

        cursor = response.response_metadata?.next_cursor;
        if (!cursor) return null;
    }
}