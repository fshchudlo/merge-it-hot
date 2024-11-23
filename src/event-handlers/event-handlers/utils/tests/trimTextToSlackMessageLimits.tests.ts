import { trimTextToSlackMessageLimits } from "../trimTextToSlackMessageLimits";

describe("trimTextToSlackMessageLimits", () => {
    it("trims text if length exceeds max Slack message length", () => {
        const longDescription = "a".repeat(40);
        const result = trimTextToSlackMessageLimits(longDescription, 30);
        expect(result).toBe("a".repeat(30));
    });

    it("cuts text to latest newline to prevent markup spoiling if text length exceeds max Slack message length", () => {
        const longDescription = 'abc\nabc\nabc\n';
        const result = trimTextToSlackMessageLimits( longDescription, 10);
        expect(result).toBe('abc\nabc');
    });
});