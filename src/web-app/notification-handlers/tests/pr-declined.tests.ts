import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("PR declined use-case", () => {
    it("Should send completion message and close the channel on PR declining", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestDeclined(), channelMock);

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should send notification to the broadcast channel, if it is specified", async () => {
        const channelMock = new SlackChannelSnapshottingMock();
        const broadcastChannelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestOpened(), channelMock, broadcastChannelMock);

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestDeclined(), channelMock, broadcastChannelMock);

        expect(broadcastChannelMock.snapshot).toMatchSnapshot();
    });
});
