import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Comment deleted use-case", () => {
    it("Should delete message if it was found", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentAdded(),
            channelMock,
        );
        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentDeleted(),
            channelMock,
        );

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should send deletion notification if the initial message was not found", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentDeletedWithoutInitialMessage(),
            channelMock,
        );

        expect(channelMock.snapshot).toMatchSnapshot();
    });
});
