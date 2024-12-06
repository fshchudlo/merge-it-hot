import { PlainTextElement } from "@slack/types";
import { trimTextToSlackMessageLimits } from "./trimTextToSlackMessageLimits";

export function plainText(text: string): PlainTextElement {
    return {
        type: "plain_text",
        text: trimTextToSlackMessageLimits(text)
    };
}