import type { Button } from "@slack/types/dist/block-kit/block-elements";
import { ColorScheme } from "@slack/types";
import { plainText } from "./plainText";

export function button(text: string, action_id: string, value: string = action_id, style: ColorScheme = "primary"): Button {
    return {
        type: "button",
        text: plainText(text),
        style: style,
        value: value,
        action_id: action_id
    };
}
