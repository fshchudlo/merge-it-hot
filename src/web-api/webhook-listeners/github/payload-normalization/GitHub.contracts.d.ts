export type GithubNotification = GithubPullRequestBasicNotification | GithubPullRequestReviewersUpdatedNotification | GithubPullRequestAssigneesUpdatedNotification;


export type GithubPullRequestBasicNotification = GithubPullRequestNotificationBasicPayload & {
    readonly action: "opened" | "closed" | "synchronize";
};

export export type GithubPullRequestReviewersUpdatedNotification = GithubPullRequestNotificationBasicPayload & {
    readonly action: "review_requested" | "review_request_removed";
    readonly requested_reviewer: GithubUserPayload;
};

export export type GithubPullRequestAssigneesUpdatedNotification = GithubPullRequestNotificationBasicPayload & {
    readonly action: "assigned" | "unassigned";
    readonly assignee: GithubUserPayload;
};

export type GithubPullRequestNotificationBasicPayload = {
    readonly number: number;
    readonly pull_request: GithubPullRequestPayload;
    readonly repository: {
        readonly name: string;
    };
    readonly sender: GithubUserPayload;
    readonly organization: { readonly login: string }
}

export type GithubPullRequestPayload = {
    readonly html_url: string;
    readonly number: string;
    readonly state: "open" | "closed";
    readonly locked: boolean;
    readonly title: string;
    readonly user: GithubUserPayload;
    readonly body: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly closed_at: string | null;
    readonly merged_at: string | null;
    readonly merge_commit_sha: string | null;
    readonly assignee: string | null;
    readonly assignees: string[];
    readonly requested_reviewers: GithubUserPayload[];
    readonly draft: boolean;
    readonly head: GithubRefPayload;
    readonly base: GithubRefPayload;
    readonly author_association: string;
    readonly auto_merge: string | null;
    readonly active_lock_reason: string | null;
    readonly merged: boolean;
    readonly mergeable: boolean | null;
    readonly rebaseable: boolean | null;
    readonly mergeable_state: "unknown" | "clean";
    readonly merged_by: GithubUserPayload | null;
    readonly comments: number;
    readonly review_comments: number;
    readonly maintainer_can_modify: boolean;
    readonly commits: number;
    readonly additions: number;
    readonly deletions: number;
    readonly changed_files: number;
}
export type GithubUserPayload = {
    readonly login: string;
    readonly type: string;
};
export type GithubRefPayload = {
    readonly ref: string;
    readonly sha: string;
    readonly repo: {
        readonly name: string;
        readonly full_name: string;
        readonly owner: GithubUserPayload
    };
};
