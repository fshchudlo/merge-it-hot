import { PullRequestGenericEvent } from "../../event-contracts";

export function getPullRequestCompletionAction(payload: PullRequestGenericEvent): {
    text: string;
    emoji: string;
    reaction: string;
} {
    switch (payload.eventKey) {
        case "pr:deleted":
            return {
                text: `Pull request was deleted by ${payload.actor.name}.`,
                emoji: ":no_entry_sign:",
                reaction: "no_entry_sign"
            };
        case "pr:declined":
            return {
                text: `Pull request was declined by ${payload.actor.name}.`,
                emoji: ":no_entry_sign:",
                reaction: "no_entry_sign"
            };
        case "pr:merged":
            return {
                text: `Pull request was merged by ${payload.actor.name}. Well done, thank you all.`,
                emoji: ":white_check_mark:",
                reaction: "white_check_mark"
            };
    }
}
