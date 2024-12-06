import { mrkdwnText } from "./mrkdwnText";
import { SectionBlock } from "@slack/types";
import { plainText } from "./plainText";

export function section(text: string, type: "plain_text" | "mrkdwn" = "mrkdwn"): SectionBlock {
    return {
        type: "section",
        text: type == "plain_text" ? plainText(text) : mrkdwnText(text)
    };
}

