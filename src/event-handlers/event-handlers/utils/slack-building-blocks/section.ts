import { textBlock } from "./textBlock";

export function section(text: string, type: string = "mrkdwn") {
    return {
        type: "section",
        text: textBlock(text, type)
    };
}
