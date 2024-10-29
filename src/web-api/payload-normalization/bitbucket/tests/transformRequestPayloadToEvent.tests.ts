import { transformRequestPayloadToEvent } from "../transformRequestPayloadToEvent";

describe("transformRequestPayloadToEvent", () => {
    it("Should throw Error on unknown action type", async () => {
        expect.assertions(1);

        try {
            await transformRequestPayloadToEvent({
                eventKey: "unknown action"
            } as any, null, null);
        } catch (error) {
            expect((error as Error).message).toBe("\"unknown action\" event key is unknown.");
        }
    });
});
