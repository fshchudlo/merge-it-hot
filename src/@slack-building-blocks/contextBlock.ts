import { mrkdwnText } from "./mrkdwnText";
import { ContextBlock } from "@slack/types/dist/block-kit/blocks";
import { plainText } from "./plainText";

export function contextBlock(text: string, type: "plain_text" | "mrkdwn" = "mrkdwn"): ContextBlock {
    return {
        type: "context",
        elements: [type == "plain_text" ? plainText(text) : mrkdwnText(text)]
    };
}
