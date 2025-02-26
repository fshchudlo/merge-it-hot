import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder, { authorUser, nonReviewerUser } from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Commit added use-case", () => {
    it("Should send message on PR commit", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestFromRefUpdated(),
            channelMock,
        );

        expect(channelMock.snapshot).toMatchSnapshot();
    });
    it("Should invite the committer to the channel if they are not participate yet", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestFromRefUpdated(authorUser),
            channelMock,
        );

        expect(channelMock.snapshot.invitesToChannels).toEqual([]);

        await handlePullRequestEvent(
            TestPayloadBuilder.pullRequestFromRefUpdated(nonReviewerUser),
            channelMock,
        );

        expect(channelMock.snapshot.invitesToChannels).toEqual([[nonReviewerUser.slackUserId]]);
    });
});
