import { WebClient } from "@slack/web-api";
import { SlackMessageSender } from "../SlackMessageSender";
import { COMMENTS_CACHE } from "../cache/COMMENTS_CACHE";
import { SlackChannelInfo } from "../../../../core/ports/SlackTargetedChannel";

jest.mock("@slack/web-api", () => ({
    WebClient: jest.fn().mockImplementation(() => ({
        chat: { postMessage: jest.fn() },
    })),
}));

jest.mock("../cache/COMMENTS_CACHE", () => ({
    COMMENTS_CACHE: {
        get: jest.fn(),
        set: jest.fn(),
        deleteWhere: jest.fn(),
    },
}));

describe("SlackMessageSender", () => {
    let slackClient: WebClient;
    let channelInfo: SlackChannelInfo;
    let channel: SlackMessageSender;

    beforeEach(() => {
        // Reset mocks before each test
        slackClient = new WebClient();
        channelInfo = { id: "C123456", name: "test-channel" };
        channel = new SlackMessageSender(
            slackClient,
            channelInfo,
            ":emoji:",
        );

        jest.clearAllMocks();
    });

    describe("sendMessage", () => {
        it("should send a message and cache comment snapshot if metadata is present", async () => {
            (slackClient.chat.postMessage as jest.Mock).mockResolvedValue({
                message: {
                    ts: "1234567890.1234",
                    thread_ts: "1234567890.0000",
                },
            });

            await channel.sendMessage({
                text: "Hello, world!",
                metadata: {
                    eventType: "test",
                    eventPayload: { commentId: "123" },
                },
                blocks: [],
                threadId: "1234567890.0000",
            });

            expect(slackClient.chat.postMessage).toHaveBeenCalledWith({
                channel: "C123456",
                icon_emoji: ":emoji:",
                text: "Hello, world!",
                metadata: {
                    event_type: "test",
                    event_payload: { commentId: "123" },
                },
                blocks: [],
                thread_ts: "1234567890.0000",
                reply_broadcast: undefined,
            });

            expect(COMMENTS_CACHE.set).toHaveBeenCalledWith("C123456-123", {
                commentId: "123",
                slackMessageId: "1234567890.1234",
                slackThreadId: "1234567890.0000",
            });
        });
    });
});
