import { formatAndTrimMarkdown } from "../formatAndTrimMarkdown";

describe("formatPullRequestDescription", () => {
    it("reformat markdown to slack markup if description is not empty", () => {
        const result = formatAndTrimMarkdown("# Description\nSome text");
        expect(result).toBe("*Description*\n\n\nSome text");
    });

    it("trims text if length exceeds max Slack message length", () => {
        const longDescription = "a".repeat(40);
        const result = formatAndTrimMarkdown(longDescription, 30);
        expect(result).toBe("a".repeat(30));
    });

    it("cuts text to latest newline to prevent markup spoiling if text length exceeds max Slack message length", () => {
        const longDescription = 'abc\nabc\nabc\n';
        const result = formatAndTrimMarkdown( longDescription, 10);
        expect(result).toBe('abc\nabc');
    });
});