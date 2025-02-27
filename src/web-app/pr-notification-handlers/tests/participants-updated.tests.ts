import SlackChannelSnapshottingMock from "./test-helpers/SlackChannelSnapshottingMock";
import TestPayloadBuilder, { botUser, reviewer3User } from "./test-helpers/TestPayloadBuilder";
import handlePullRequestEvent from "../handlePullRequestEvent";

describe("Participants updated use-case", () => {
    it("Should add and remove users from channel on reviewers list update", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.participantsUpdated(), channelMock, null);

        expect(channelMock.snapshot).toMatchSnapshot();
    });

    it("Should not delete removed reviewer if he is still participating as assignee or PR author", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.reviewerRemovedButHeIsAnAssignee(), channelMock, null);

        expect(channelMock.snapshot).toMatchSnapshot();
    });
    it("Shouldn't add bot users to the channel", async () => {
        const channelMock = new SlackChannelSnapshottingMock();

        await handlePullRequestEvent(TestPayloadBuilder.participantsUpdated([reviewer3User, botUser]), channelMock, null);

        expect(channelMock.snapshot.invitesToChannels).toEqual([[reviewer3User.slackUserId]]);
    });

});
