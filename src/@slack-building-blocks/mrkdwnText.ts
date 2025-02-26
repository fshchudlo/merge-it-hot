import { trimTextToSlackMessageLimits } from "./trimTextToSlackMessageLimits";
import { MrkdwnElement } from "@slack/types/dist/block-kit/composition-objects";

export function mrkdwnText(text: string): MrkdwnElement {
    return {
        type: "mrkdwn",
        text: trimTextToSlackMessageLimits(text)
    };
}
