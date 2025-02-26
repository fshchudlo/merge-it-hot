import { DividerBlock } from "@slack/types";

export function divider(): DividerBlock {
    return {
        type: "divider"
    };
}
