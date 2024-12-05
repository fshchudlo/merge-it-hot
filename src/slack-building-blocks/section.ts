import { textBlock } from "./textBlock";
import { SectionBlock } from "@slack/types";

export function section(text: string, type: "plain_text" | "mrkdwn" = "mrkdwn"): SectionBlock {
    return {
        type: "section",
        text: textBlock(text, type)
    };
}

