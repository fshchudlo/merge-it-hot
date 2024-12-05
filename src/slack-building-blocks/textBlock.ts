import { trimTextToSlackMessageLimits } from "./trimTextToSlackMessageLimits";
import { PlainTextElement } from "@slack/types";
import { MrkdwnElement } from "@slack/types/dist/block-kit/composition-objects";

export function textBlock(text: string, type: "plain_text" | "mrkdwn" = "mrkdwn"): PlainTextElement | MrkdwnElement {
    return {
        type: type,
        text: trimTextToSlackMessageLimits(text)
    };
}
