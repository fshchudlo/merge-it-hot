import {
    PullRequestEvent,
    PullRequestGenericEvent,
    PullRequestCommentActionEvent,
    PullRequestModifiedEvent,
    PullRequestParticipantsUpdatedEvent
} from "../../event-contracts";

const authorUser = {
    name: "Test Author",
    slackUserId: "000000"
};
const reviewer1User = {
    name: "Test Reviewer 1",
    slackUserId: "111111"
};
const reviewer2User = {
    name: "Test Reviewer 2",
    slackUserId: "222222"
};
const reviewer3User = {
    name: "Test Reviewer 3",
    slackUserId: "333333"
};

function getBasicPayload(): PullRequestGenericEvent {
    return {
        eventKey: "pr:opened",
        actor: { ...authorUser },
        pullRequest: {
            number: 1,
            createdAt: new Date(1714381184802),
            title: "Test pull request title",
            description: "Test pull request description",
            draft: false,
            fromBranch: {
                branchName: "feature/test-branch",
                latestCommit: "from-ref-commit-hash",
                repositoryName: "test-repository",
                projectKey: "TEST-PROJ"
            },
            targetBranch: {
                branchName: "main",
                latestCommit: "to-ref-commit-hash",
                repositoryName: "test-repository",
                projectKey: "TEST-PROJ"
            },
            author: { ...authorUser },
            participants: [{
                user: { ...reviewer1User },
                status: "UNAPPROVED"
            }, {
                user: { ...reviewer2User },
                status: "UNAPPROVED"
            }],
            assignees: [],
            links: {
                self: "https://git.test.com/projects/TEST-PROJ/repos/test-repository/pull-requests/1/overview"
            }
        }
    };

}

export default class TestPayloadBuilder {
    static pullRequestDraftOpened(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            pullRequest: {
                ...getBasicPayload().pullRequest,
                draft: true
            },
            eventKey: "pr:opened"
        };
    }
    static pullRequestIsReadyForReview(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            pullRequest: {
                ...getBasicPayload().pullRequest,
                draft: false
            },
            eventKey: "pr:ready_for_review"
        };
    }
    static pullRequestOpened(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:opened"
        };
    }

    static pullRequestMerged(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:merged"
        };
    }

    static pullRequestDeclined(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:declined"
        };
    }

    static pullRequestDeleted(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:deleted"
        };
    }
    static pullRequestReopened(): PullRequestEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:reopened"
        };
    }

    static pullRequestCommentDeleted(): PullRequestCommentActionEvent {
        const payload = this.pullRequestCommentAdded() as any;
        return {
            ...payload,
            eventKey: "pr:comment:deleted"
        };
    }

    static pullRequestCommentAdded(): PullRequestCommentActionEvent {
        const payload = getBasicPayload();
        return {
            ...getBasicPayload(),
            eventKey: "pr:comment:added",
            actor: { ...reviewer1User },
            comment: {
                id: 1,
                severity: "NORMAL",
                text: "Test comment",
                author: { ...reviewer1User },
                link: `${payload.pullRequest.links.self}?commentId=1`
            }
        };
    }

    static pullRequestTaskAdded(): PullRequestCommentActionEvent {
        const basicPayload = this.pullRequestCommentAdded();
        return {
            ...basicPayload,
            comment: {
                ...basicPayload.comment,
                severity: "BLOCKER"
            }
        };
    }

    static pullRequestCommentEdited(): PullRequestCommentActionEvent {
        const payload = this.pullRequestCommentAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                text: "Updated comment text"
            }
        };
    }

    static pullRequestCommentConvertedToTheTask(): PullRequestCommentActionEvent {
        const payload = this.pullRequestCommentAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                severity: "BLOCKER"
            }
        };
    }

    static pullRequestTaskConvertedToTheComment(): PullRequestCommentActionEvent {
        const payload = this.pullRequestTaskAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                severity: "NORMAL"
            }
        };
    }

    static pullRequestTaskResolved(): PullRequestCommentActionEvent {
        const payload = this.pullRequestTaskAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                resolvedAt: new Date(1714381184802)
            }
        };
    }

    static pullRequestTaskReopened(): PullRequestCommentActionEvent {
        const payload = this.pullRequestTaskAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                resolvedAt: undefined
            }
        };
    }

    static pullRequestCommentResolved(): PullRequestCommentActionEvent {
        const payload = this.pullRequestCommentAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                threadResolvedAt: new Date(1714381184802)
            }
        };
    }

    static pullRequestCommentReopened(): PullRequestCommentActionEvent {
        const payload = this.pullRequestCommentAdded();
        return {
            ...payload,
            eventKey: "pr:comment:edited",
            comment: {
                ...payload.comment,
                threadResolvedAt: undefined
            }
        };
    }

    static pullRequestModifiedWithoutVisibleChanges(): PullRequestModifiedEvent {
        const prCreatedPayload = TestPayloadBuilder.pullRequestOpened();
        return <PullRequestModifiedEvent>{
            ...prCreatedPayload,
            eventKey: "pr:modified",
            previousDescription: prCreatedPayload.pullRequest.description,
            previousTitle: prCreatedPayload.pullRequest.title,
            previousTargetBranch: {
                branchName: prCreatedPayload.pullRequest.targetBranch.branchName,
                latestCommit: prCreatedPayload.pullRequest.targetBranch.latestCommit
            }
        };
    }

    static pullRequestModified(): PullRequestModifiedEvent {
        const payload = getBasicPayload();

        return {
            ...payload,
            eventKey: "pr:modified",
            previousDescription: payload.pullRequest.description,
            previousTitle: payload.pullRequest.title,
            previousTargetBranch: {
                branchName: payload.pullRequest.targetBranch.branchName,
                latestCommit: payload.pullRequest.targetBranch.latestCommit
            },
            pullRequest: {
                ...payload.pullRequest,
                title: "New pull request title",
                description: "New pull request description",
                targetBranch: { ...payload.pullRequest.targetBranch, branchName: "not-the-main" }
            }
        };
    }

    static pullRequestNeedsWork(): PullRequestEvent {
        const payload = getBasicPayload();

        payload.pullRequest.participants[0] = {
            ...payload.pullRequest.participants[0],
            status: "NEEDS_WORK"
        };

        return {
            ...payload,
            eventKey: "pr:review:submitted",
            actor: { ...reviewer1User },
            review: {
                state: "CHANGES_REQUESTED",
                comment: null
            }
        };
    }

    static pullRequestApproved(): PullRequestEvent {
        const payload = getBasicPayload();
        payload.pullRequest.participants[0] = {
            ...payload.pullRequest.participants[0],
            status: "APPROVED"
        };

        return {
            ...payload,
            eventKey: "pr:review:submitted",
            actor: { ...reviewer1User },
            review: {
                state: "APPROVED",
                comment: null
            }
        };
    }

    static pullRequestReviewedWithComments(): PullRequestEvent {
        const payload = getBasicPayload();
        payload.pullRequest.participants[0] = {
            ...payload.pullRequest.participants[0],
            status: "APPROVED"
        };

        return {
            ...payload,
            eventKey: "pr:review:submitted",
            actor: { ...reviewer1User },
            review: {
                state: "COMMENTED",
                comment: "Please, implement x, y, and z"
            }
        };
    }

    static pullRequestReviewedNoReviewerStatuses(): PullRequestEvent {
        const payload = getBasicPayload();
        return {
            ...payload,
            pullRequest: {
                ...payload.pullRequest,
                participants: payload.pullRequest.participants.map(r => {
                    return {
                        user: r.user
                    };
                })
            },
            eventKey: "pr:review:submitted",
            actor: { ...reviewer1User },
            review: {
                state: "APPROVED",
                comment: null
            }
        };
    }

    static pullRequestUnapproved(): PullRequestEvent {
        const payload = getBasicPayload();

        payload.pullRequest.participants[0] = {
            ...payload.pullRequest.participants[0],
            status: "UNAPPROVED"
        };

        return {
            ...payload,
            eventKey: "pr:review:submitted",
            actor: { ...reviewer1User },
            review: {
                state: "DISMISSED",
                comment: null
            }
        };
    }

    static pullRequestFromRefUpdated(): PullRequestEvent {
        const basicPayload = getBasicPayload();
        return {
            ...basicPayload,
            ...{
                fromRef: {
                    latestCommit: "from-ref-updated-hash"
                }
            },
            eventKey: "pr:from_ref_updated",
            latestCommitMessage: `Test comment for ${basicPayload.pullRequest.fromBranch.projectKey}, ${basicPayload.pullRequest.fromBranch.repositoryName}, ${basicPayload.pullRequest.fromBranch.latestCommit}`,
            latestCommitViewUrl: `${basicPayload.pullRequest.links.self.replace("/overview", "")}/commits/${basicPayload.pullRequest.fromBranch.latestCommit}`
        };
    }

    static participantsUpdated(): PullRequestParticipantsUpdatedEvent {
        return {
            ...getBasicPayload(),
            eventKey: "pr:participants:changed",
            addedParticipants: [reviewer3User],
            removedParticipants: [reviewer1User],

            pullRequest: {
                ...getBasicPayload().pullRequest,
                participants: [{
                    user: { ...reviewer2User },
                    status: "UNAPPROVED"
                }, {
                    user: { ...reviewer3User },
                    status: "UNAPPROVED"
                }]
            }
        };
    }

    static reviewerRemovedButHeIsAnAssignee(): PullRequestParticipantsUpdatedEvent {
        const payload = TestPayloadBuilder.participantsUpdated();
        return {
            ...payload,
            pullRequest: {
                ...payload.pullRequest,
                assignees: payload.removedParticipants.map(p => p)
            }
        };
    }
}