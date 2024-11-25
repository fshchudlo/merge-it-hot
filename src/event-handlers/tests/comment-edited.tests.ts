import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Comment edited use-case", () => {
    it("Should edit initial message on PR comment edit", async () => {
        const channelMock = new SlackChannelSnapshottingMock();
        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentAdded(),
            channelMock,
        );

        const payload = TestPayloadBuilder.pullRequestCommentEdited();
        await handlePullRequestEvent(payload, channelMock);

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should send message on comment resolving and reopening", async () => {
        const channelMock = new SlackChannelSnapshottingMock();
        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentAdded(),
            channelMock,
        );

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentResolved(),
            channelMock,
        );
        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentReopened(),
            channelMock,
        );

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should send generic message if initial comment was not found", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestCommentReopened(),
            channelMock,
        );

        expect(channelMock.snapshot).toMatchSnapshot();
    });
});
