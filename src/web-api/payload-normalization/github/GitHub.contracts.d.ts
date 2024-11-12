export type GitHubNotification =
    GitHubPullRequestBasicNotification
    | GitHubPullRequestReviewersUpdatedNotification
    | GitHubPullRequestAssigneesUpdatedNotification
    | GitHubPullRequestEditedNotification
    | GitHubPullRequestReviewSubmittedNotification
    | GitHubPullRequestThreadResolutionNotification;

export type GitHubPullRequestBasicNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "opened" | "closed" | "reopened" | "synchronize" | "ready_for_review" | "converted_to_draft" | "auto_merge_enabled" | "auto_merge_disabled" | "labeled" | "unlabeled" | "locked" | "unlocked" | "milestoned" | "demilestoned";
};

export export type GitHubPullRequestReviewersUpdatedNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "review_requested" | "review_request_removed";
    readonly requested_reviewer?: GitHubUserPayload;
    readonly requested_team?: GitHubTeamPayload;
};

export export type GitHubPullRequestAssigneesUpdatedNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "assigned" | "unassigned";
    readonly assignee: GitHubUserPayload;
};
export export type GitHubPullRequestEditedNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "edited";
    readonly changes: {
        readonly body?: {
            readonly from: string;
        }
        readonly title?: {
            from: string;
        }
        readonly base?: {
            readonly ref: {
                from: string;
            }
            readonly sha: {
                readonly from: string;
            }
        }
    }
};

export export type GitHubPullRequestReviewSubmittedNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "submitted";
    readonly review: {
        state: GitHubPullRequestReviewState;
        body?: null
    };
};

export export type GitHubPullRequestCommentNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: GitHubPullRequestCommentActionType;
    readonly comment: GitHubPullRequestCommentPayload;
    readonly changes?: {
        readonly body?: {
            readonly from: string;
        }
    };
};

export export type GitHubPullRequestThreadResolutionNotification = GitHubPullRequestNotificationBasicPayload & {
    readonly action: "resolved" | "unresolved";
    readonly thread: {
        comments: GitHubPullRequestCommentPayload[]
    };
};


export type GitHubPullRequestNotificationBasicPayload = {
    readonly pull_request: GitHubPullRequestPayload;
    readonly repository: {
        readonly name: string;
    };
    readonly sender: GitHubUserPayload;
    readonly organization: { readonly login: string }
}

export type GitHubPullRequestCommentPayload = {
    readonly html_url: string;
    readonly id: number;
    readonly path?: string;
    readonly user: GitHubUserPayload;
    readonly body: string;
    readonly updated_at: string;
    readonly in_reply_to_id?: number;
};

export type GitHubPullRequestPayload = {
    readonly html_url: string;
    readonly number: number;
    readonly state: "open" | "closed";
    readonly locked: boolean;
    readonly title: string;
    readonly user: GitHubUserPayload;
    readonly body: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly closed_at: string | null;
    readonly merged_at: string | null;
    readonly merge_commit_sha: string | null;
    readonly assignee: string | null;
    readonly assignees: GitHubUserPayload[];
    readonly requested_reviewers: GitHubUserPayload[];
    readonly requested_teams: GitHubTeamPayload[];
    readonly draft: boolean;
    readonly head: GitHubRefPayload;
    readonly base: GitHubRefPayload;
    readonly merged: boolean;
    readonly review_comments: number;
}
export type GitHubTeamPayload = {
    members_url: string
};
export type GitHubUserPayload = {
    readonly login: string;
    readonly type: "User" | "Mannequin" | "Bot";
    readonly html_url: string;
};
export type GitHubRefPayload = {
    readonly ref: string;
    readonly sha: string;
    readonly repo: {
        readonly name: string;
        readonly full_name: string;
        readonly owner: GitHubUserPayload
    };
};

export type GitHubPullRequestCommentActionType = "created" | "edited" | "deleted";
export type GitHubPullRequestReviewState = "commented" | "approved" | "changes_requested" | "dismissed";
export type GitHubPullRequestEventType = "pull_request" | "issue_comment" | "pull_request_review_comment" | "pull_request_review_thread" | "pull_request_review";