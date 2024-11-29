import { trimTextToSlackMessageLimits } from "../trimTextToSlackMessageLimits";

export function textBlock(text: string, type: string = "mrkdwn") {
    return {
        type: type,
        text: trimTextToSlackMessageLimits(text),
    };
}
