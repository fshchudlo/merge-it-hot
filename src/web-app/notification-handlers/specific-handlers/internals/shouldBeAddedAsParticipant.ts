import { PullRequestNotificationBasicPayload, UserPayload } from "../../event-contracts";

export default function shouldBeAddedAsParticipant(pullRequest: PullRequestNotificationBasicPayload, user: UserPayload): boolean {
    if (user.isBotUser) {
        return false;
    }
    return (
        pullRequest.pullRequest.author.slackUserId !== user.slackUserId &&
        pullRequest.pullRequest.participants.every(p => p.user.slackUserId !== user.slackUserId) &&
        pullRequest.pullRequest.assignees.every(a => a.slackUserId !== user.slackUserId)
    );
}
