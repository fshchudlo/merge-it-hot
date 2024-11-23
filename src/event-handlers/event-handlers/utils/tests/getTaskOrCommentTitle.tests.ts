import { getTaskOrCommentTitle } from "../getTaskOrCommentTitle";
import { PullRequestCommentActionEvent } from "../../../event-contracts";

describe("getTaskOrCommentTitle", () => {
    it("should return \"task\" for BLOCKER severity", () => {
        const payload = {
            comment: {
                severity: "BLOCKER"
            }
        } as PullRequestCommentActionEvent;
        expect(getTaskOrCommentTitle(payload)).toBe("task");
    });

    it("should return \"comment\" for NORMAL severity", () => {
        const payload = {
            comment: {
                severity: "NORMAL"
            }
        } as PullRequestCommentActionEvent;
        expect(getTaskOrCommentTitle(payload)).toBe("comment");
    });

    it("should throw an error for unknown severity", () => {
        const payload = {
            comment: {
                severity: "UNKNOWN"
            }
        } as unknown as PullRequestCommentActionEvent;
        expect(() => getTaskOrCommentTitle(payload)).toThrowError("\"UNKNOWN\" comment severity is unknown.");
    });
});