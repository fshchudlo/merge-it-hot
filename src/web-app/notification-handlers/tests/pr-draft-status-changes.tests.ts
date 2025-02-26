import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("PR draft status change use-cases", () => {
    describe("PR is ready for review use-case", () => {
        it("Should send notification when PR is marked as ready for review", async () => {
            const channelMock = new SlackChannelSnapshottingMock();

            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestDraftOpened(),
                channelMock,
            );
            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestIsReadyForReview(),
                channelMock,
            );

            expect(channelMock.snapshot).toMatchSnapshot();
        });

        it("Should send notification to the broadcast channel, if it is specified", async () => {
            const channelMock = new SlackChannelSnapshottingMock();
            const broadcastChannelMock = new SlackChannelSnapshottingMock();

            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestDraftOpened(),
                channelMock,
                broadcastChannelMock,
            );
            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestIsReadyForReview(),
                channelMock,
                broadcastChannelMock,
            );

            expect(broadcastChannelMock.snapshot).toMatchSnapshot();
        });
    });

    describe("PR is drafted use-case", () => {
        it("Should send notification when PR is marked as draft", async () => {
            const channelMock = new SlackChannelSnapshottingMock();

            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestOpened(),
                channelMock,
            );
            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestIsConvertedToDraft(),
                channelMock,
            );

            expect(channelMock.snapshot).toMatchSnapshot();
        });

        it("Should send notification to the broadcast channel, if it is specified", async () => {
            const channelMock = new SlackChannelSnapshottingMock();
            const broadcastChannelMock = new SlackChannelSnapshottingMock();

            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestOpened(),
                channelMock,
                broadcastChannelMock,
            );
            await handlePullRequestEvent(
                TestPayloadBuilder.pullRequestIsConvertedToDraft(),
                channelMock,
                broadcastChannelMock,
            );

            expect(broadcastChannelMock.snapshot).toMatchSnapshot();
        });
    });
});
