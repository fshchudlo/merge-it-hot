import { textBlock } from "./textBlock";
import { ContextBlock } from "@slack/types/dist/block-kit/blocks";

export function contextBlock(text: string, type: "plain_text" | "mrkdwn" = "mrkdwn"): ContextBlock {
    return {
        type: "context",
        elements: [textBlock(text, type)]
    };
}
