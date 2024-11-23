import { PullRequestCommentActionEvent } from "../../event-contracts";

export function getTaskOrCommentTitle(payload: PullRequestCommentActionEvent): "task" | "comment" {
    switch (payload.comment.severity) {
        case "BLOCKER":
            return "task";
        case "NORMAL":
            return "comment";
        default:
            throw new Error(`"${payload.comment.severity}" comment severity is unknown.`);
    }
}