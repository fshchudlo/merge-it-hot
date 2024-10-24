import { normalizeGitHubPayload } from "../normalizeGitHubPayload";

describe("normalizeGitHubPayload.tests", () => {
    it("Should throw Error on unknown action type", async () => {
        expect.assertions(1);

        try {
            await normalizeGitHubPayload({
                action: "unknown action"
            } as any, null, null);
        } catch (error) {
            expect((error as Error).message).toBe("\"unknown action\" action key is unknown.");
        }
    });
});
