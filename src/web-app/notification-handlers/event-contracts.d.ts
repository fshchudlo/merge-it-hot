export type PullRequestEvent =
    | PullRequestGenericEvent
    | PullRequestCommentActionEvent
    | PullRequestModifiedEvent
    | PullRequestFromBranchUpdatedEvent
    | PullRequestParticipantsUpdatedEvent
    | PullRequestReviewSubmittedEvent;

export type PullRequestNotificationBasicPayload = {
    readonly actor: UserPayload;
    readonly pullRequest: PullRequestPayload;
};

export type PullRequestGenericEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: "pr:reopened" | "pr:opened" | "pr:ready_for_review" | "pr:converted_to_draft" | "pr:merged" | "pr:declined" | "pr:deleted";
};

export type PullRequestReviewSubmittedEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: "pr:review:submitted";
    readonly review: {
        state: PullRequestReviewState;
        comment: string | null;
    };
};

export type PullRequestCommentActionEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: PullRequestCommentActionEventKey;
    readonly previousComment?: string;
    readonly comment: PullRequestCommentPayload;
};

export type PullRequestCommentActionEventKey = "pr:comment:added" | "pr:comment:deleted" | "pr:comment:edited";
export type PullRequestModifiedEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: "pr:modified";
    readonly previousTitle: string;
    readonly previousDescription: string | null;
    readonly previousTargetBranch?: {
        readonly branchName: string;
        readonly latestCommit: string;
    };
};
export type PullRequestParticipantsUpdatedEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: "pr:participants:changed";
    readonly addedParticipants: Array<UserPayload>;
    readonly removedParticipants: Array<UserPayload>;
};
export type PullRequestFromBranchUpdatedEvent = PullRequestNotificationBasicPayload & {
    readonly eventKey: "pr:from_ref_updated";
    readonly latestCommitMessage: string | null;
    readonly latestCommitViewUrl: string;
};

export type UserPayload = {
    readonly name: string;
    readonly isBotUser: boolean;
    readonly slackUserId: string;
};

export type BranchPayload = {
    readonly branchName: string;
    readonly latestCommit: string;
    readonly repositoryName: string;
    readonly projectKey: string;
};
export type PullRequestCommentPayload = {
    readonly id: number;
    readonly replyToCommentId?: number;
    readonly text: string;
    readonly author: UserPayload;
    readonly resolvedAt?: Date;
    readonly link: string;
};
export type PullRequestPayload = {
    readonly number: number;
    readonly createdAt: Date;
    readonly title: string;
    readonly description: string | null;
    readonly isDraft: boolean;
    readonly author: UserPayload;
    readonly participants: Array<ParticipantPayload>;
    readonly assignees: Array<UserPayload>;
    readonly links: {
        readonly self: string;
    };
    readonly fromBranch: BranchPayload;
    readonly targetBranch: BranchPayload;
};
export type ParticipantPayload = {
    user: UserPayload;
    status?: ReviewerReviewStatus;
};
export type ReviewerReviewStatus = "UNAPPROVED" | "NEEDS_WORK" | "APPROVED";
export type PullRequestReviewState = "COMMENTED" | "APPROVED" | "CHANGES_REQUESTED" | "DISMISSED";
