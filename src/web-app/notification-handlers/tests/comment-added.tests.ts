import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder, { nonReviewerUser, reviewer1User } from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Comment added use-case", () => {
    it("Should send message on PR comment", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestCommentAdded(), channelMock);

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should invite the commenter to the channel if they are not participate yet", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestCommentAdded(reviewer1User), channelMock);

        expect(channelMock.snapshot.invitesToChannels).toEqual([]);

        await handlePullRequestEvent(TestPayloadBuilder.pullRequestCommentAdded(nonReviewerUser), channelMock);

        expect(channelMock.snapshot.invitesToChannels).toEqual([[nonReviewerUser.slackUserId]]);
    });
});
