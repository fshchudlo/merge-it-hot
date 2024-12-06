import { transformGithubPayloadToAppEvent } from "../transformGithubPayloadToAppEvent";

describe("transformRequestPayloadToEvent.tests", () => {
    it("Should throw Error on unknown event type", async () => {
        expect.assertions(1);

        try {
            await transformGithubPayloadToAppEvent(
                "unknown event type" as any,
                {
                    action: "unknown action",
                } as any,
                null,
                null,
            );
        } catch (error) {
            expect((error as Error).message).toBe(
                '"unknown event type" event type is unknown.',
            );
        }
    });
    it("Should throw Error on unknown action type", async () => {
        expect.assertions(1);

        try {
            await transformGithubPayloadToAppEvent(
                "pull_request",
                {
                    action: "unknown action",
                } as any,
                null,
                null,
            );
        } catch (error) {
            expect((error as Error).message).toBe(
                '"unknown action" action key is unknown.',
            );
        }
    });
});
