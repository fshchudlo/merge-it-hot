import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Comment added use-case", () => {
    it("Should send message on PR comment", async () => {
        const channelMock = new SlackChannelSnapshottingMock();


        await handlePullRequestEvent(TestPayloadBuilder.pullRequestCommentAdded(), channelMock);


        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should send message on PR task", async () => {
        const channelMock = new SlackChannelSnapshottingMock();


        await handlePullRequestEvent(TestPayloadBuilder.pullRequestTaskAdded(), channelMock);


        expect(channelMock.snapshot).toMatchSnapshot();
    });
});
