import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("PR reopened use-case", () => {
    it("Should send reopening message on PR reopening", async () => {
        const channelMock = new SlackChannelSnapshottingMock();
        const payload = TestPayloadBuilder.pullRequestReopened();

        await handlePullRequestEvent(payload, channelMock);

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
            TestPayloadBuilder.pullRequestReopened(),
            channelMock,
            broadcastChannelMock,
        );

        expect(broadcastChannelMock.snapshot).toMatchSnapshot();
    });
});
