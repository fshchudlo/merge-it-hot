import { WebClient } from "@slack/web-api";
import { SlackChannelInfo } from "../../SlackChannelProvisioner";
import { SlackWebClientChannel } from "../SlackWebClientChannel";
import { CHANNELS_CACHE } from "../../CHANNELS_CACHE";
import { COMMENTS_CACHE } from "../../COMMENTS_CACHE";
import { SNAPSHOT_COMMENT_STATE_EVENT_TYPE } from "../../../../event-handlers/event-handlers/utils";

jest.mock("@slack/web-api", () => ({
    WebClient: jest.fn().mockImplementation(() => ({
        bookmarks: { add: jest.fn() },
        conversations: {
            invite: jest.fn(),
            kick: jest.fn(),
            archive: jest.fn(),
            unarchive: jest.fn(),
            history: jest.fn()
        },
        reactions: { add: jest.fn() },
        chat: { postMessage: jest.fn() }
    }))
}));

jest.mock("../../CHANNELS_CACHE", () => ({
    CHANNELS_CACHE: {
        delete: jest.fn()
    }
}));
jest.mock("../../COMMENTS_CACHE", () => ({
    COMMENTS_CACHE: {
        get: jest.fn(),
        set: jest.fn(),
        deleteWhere: jest.fn()
    }
}));

describe("SlackWebClientChannel", () => {
    let slackClient: WebClient;
    let channelInfo: SlackChannelInfo;
    let channel: SlackWebClientChannel;

    beforeEach(() => {
        // Reset mocks before each test
        slackClient = new WebClient();
        channelInfo = { id: "C123456", name: "test-channel" };
        channel = new SlackWebClientChannel(slackClient, channelInfo, ":emoji:");

        jest.clearAllMocks();
    });

    describe("addBookmark", () => {
        it("should add a bookmark with correct parameters", async () => {
            await channel.addBookmark({ link: "https://example.com", title: "Example" });

            expect(slackClient.bookmarks.add).toHaveBeenCalledWith({
                channel_id: "C123456",
                link: "https://example.com",
                title: "Example",
                type: "link"
            });
        });
    });

    describe("inviteToChannel", () => {
        it("should invite users to the channel", async () => {
            await channel.inviteToChannel({ users: ["U123", "U456"], force: true });

            expect(slackClient.conversations.invite).toHaveBeenCalledWith({
                channel: "C123456",
                users: "U123,U456",
                force: true
            });
        });

        it("should ignore 'already_in_channel' errors", async () => {
            (slackClient.conversations.invite as jest.Mock).mockRejectedValueOnce({
                data: { errors: [{ error: "already_in_channel" }] }
            });

            await expect(channel.inviteToChannel({ users: ["U123"], force: true })).resolves.toBeUndefined();
        });
    });

    describe("kickFromChannel", () => {
        it("should kick users from the channel", async () => {
            await channel.kickFromChannel({ users: ["U123", "U456"] });

            expect(slackClient.conversations.kick).toHaveBeenCalledTimes(2);
            expect(slackClient.conversations.kick).toHaveBeenCalledWith({
                channel: "C123456",
                user: "U123"
            });
            expect(slackClient.conversations.kick).toHaveBeenCalledWith({
                channel: "C123456",
                user: "U456"
            });
        });

        it("should ignore 'not_in_channel' errors", async () => {
            (slackClient.conversations.kick as jest.Mock).mockRejectedValueOnce({
                data: { error: "not_in_channel" }
            });

            await expect(channel.kickFromChannel({ users: ["U123"] })).resolves.toBeUndefined();
        });
    });

    describe("closeChannel", () => {
        it("should archive the channel and clear caches", async () => {
            await channel.closeChannel();

            expect(slackClient.conversations.archive).toHaveBeenCalledWith({ channel: "C123456" });
            expect(CHANNELS_CACHE.delete).toHaveBeenCalledWith("test-channel");
            expect(COMMENTS_CACHE.deleteWhere).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe("addReaction", () => {
        it("should add a reaction to a message", async () => {
            await channel.addReaction("1234567890.1234", "thumbsup");

            expect(slackClient.reactions.add).toHaveBeenCalledWith({
                channel: "C123456",
                timestamp: "1234567890.1234",
                name: "thumbsup"
            });
        });
    });

    describe("sendMessage", () => {
        it("should send a message and cache comment snapshot if metadata is present", async () => {
            (slackClient.chat.postMessage as jest.Mock).mockResolvedValue({
                message: { ts: "1234567890.1234", thread_ts: "1234567890.0000" }
            });

            await channel.sendMessage({
                text: "Hello, world!",
                metadata: { eventType: "test", eventPayload: { commentId: "123" } },
                blocks: [],
                threadId: "1234567890.0000"
            });

            expect(slackClient.chat.postMessage).toHaveBeenCalledWith({
                channel: "C123456",
                icon_emoji: ":emoji:",
                text: "Hello, world!",
                metadata: { event_type: "test", event_payload: { commentId: "123" } },
                blocks: [],
                thread_ts: "1234567890.0000",
                reply_broadcast: undefined
            });

            expect(COMMENTS_CACHE.set).toHaveBeenCalledWith("C123456-123", {
                commentId: "123",
                slackMessageId: "1234567890.1234",
                slackThreadId: "1234567890.0000"
            });
        });
    });

    describe("findLatestPullRequestCommentSnapshot", () => {
        it("should return cached comment snapshot if available", async () => {
            (COMMENTS_CACHE.get as jest.Mock).mockResolvedValue({ commentId: "123" });

            const result = await channel.findLatestPullRequestCommentSnapshot("123");

            expect(result).toEqual({ commentId: "123" });
        });

        it("should retrieve and cache comment snapshot if not in cache", async () => {
            (COMMENTS_CACHE.get as jest.Mock).mockResolvedValue(null);
            (slackClient.conversations.history as jest.Mock).mockResolvedValue({
                messages: [
                    {
                        ts: "1234567890.1234", metadata:
                            {
                                event_type: SNAPSHOT_COMMENT_STATE_EVENT_TYPE,
                                event_payload: {
                                    commentId: "123"
                                }
                            }
                    }],
                response_metadata: {}
            });

            const result = await channel.findLatestPullRequestCommentSnapshot("123");

            expect(result).toEqual({
                commentId: "123",
                slackMessageId: "1234567890.1234",
                slackThreadId: undefined
            });
            expect(COMMENTS_CACHE.set).toHaveBeenCalledWith("C123456-123", result);
        });
    });
});
