import { PullRequestNotificationBasicPayload, UserPayload } from "../../event-contracts";

export default function isPullRequestParticipant(pullRequest: PullRequestNotificationBasicPayload, user: UserPayload): boolean {
    return pullRequest.pullRequest.author.slackUserId === user.slackUserId
        || pullRequest.pullRequest.participants.some(p => p.user.slackUserId === user.slackUserId)
        || pullRequest.pullRequest.assignees.some(a => a.slackUserId === user.slackUserId);
}