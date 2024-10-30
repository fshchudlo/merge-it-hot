import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("PR review submitted use-case", () => {
    it("Should send message on PR review submit", async () => {
        const channelMock = new SlackChannelSnapshottingMock();


        await handlePullRequestEvent(TestPayloadBuilder.pullRequestNeedsWork(), channelMock);
        await handlePullRequestEvent(TestPayloadBuilder.pullRequestUnapproved(), channelMock);
        await handlePullRequestEvent(TestPayloadBuilder.pullRequestApproved(), channelMock);
        await handlePullRequestEvent(TestPayloadBuilder.pullRequestReviewedWithComments(), channelMock);
        await handlePullRequestEvent(TestPayloadBuilder.pullRequestReviewedNoReviewerStatuses(), channelMock);


        expect(channelMock.snapshot).toMatchSnapshot();
    });
});
