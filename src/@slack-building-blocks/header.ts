import { HeaderBlock } from "@slack/types";

export function header(text: string): HeaderBlock {
    return {
        type: "header",
        text: {
            type: "plain_text",
            text: text,
            emoji: true
        }
    };
}
