import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder, { nonReviewerUser, reviewer1User } from "./test-helpers/TestPayloadBuilder";
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

    it("Should invite the reviewer to the channel if they are not participate yet", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestNeedsWork(reviewer1User), channelMock);

        expect(channelMock.snapshot.invitesToChannels).toEqual([]);

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestNeedsWork(nonReviewerUser), channelMock);

        expect(channelMock.snapshot.invitesToChannels).toEqual([[nonReviewerUser.slackUserId]]);
    });
});
