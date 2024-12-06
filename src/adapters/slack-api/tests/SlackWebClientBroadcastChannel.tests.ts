import { WebClient } from "@slack/web-api";
import { SlackWebClientBroadcastChannel } from "../SlackWebClientBroadcastChannel";
import { SlackChannelInfo } from "../../../core/ports/SlackTargetedChannel";

jest.mock("@slack/web-api", () => ({
    WebClient: jest.fn().mockImplementation(() => ({
        conversations: {
            history: jest.fn(),
        },
        reactions: { add: jest.fn() },
        chat: { postMessage: jest.fn() },
    })),
}));

describe("SlackWebClientChannel", () => {
    let slackClient: WebClient;
    let channelInfo: SlackChannelInfo;
    let channel: SlackWebClientBroadcastChannel;

    beforeEach(() => {
        // Reset mocks before each test
        slackClient = new WebClient();
        channelInfo = { id: "C123456", name: "test-channel" };
        channel = new SlackWebClientBroadcastChannel(
            slackClient,
            channelInfo,
            ":emoji:",
        );

        jest.clearAllMocks();
    });
    describe("addReaction", () => {
        it("should add a reaction to a message", async () => {
            await channel.addReaction("1234567890.1234", "thumbsup");

            expect(slackClient.reactions.add).toHaveBeenCalledWith({
                channel: "C123456",
                timestamp: "1234567890.1234",
                name: "thumbsup",
            });
        });
    });

});
