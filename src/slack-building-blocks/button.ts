import { textBlock } from "./textBlock";
import type { Button } from "@slack/types/dist/block-kit/block-elements";
import { ColorScheme, PlainTextElement } from "@slack/types";

export function button(text: string, action_id: string, value: string = action_id, style: ColorScheme = "primary"): Button {
    return {
        type: "button",
        text: textBlock(text, "plain_text") as PlainTextElement,
        style: style,
        value: value,
        action_id: action_id
    };
}