import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Comment deleted use-case", () => {
    it("Should send message on PR comment deletion", async () => {
        const channelMock = new SlackChannelSnapshottingMock();


        await handlePullRequestEvent(TestPayloadBuilder.pullRequestCommentDeleted(), channelMock);


        expect(channelMock.snapshot).toMatchSnapshot();
    });
});
