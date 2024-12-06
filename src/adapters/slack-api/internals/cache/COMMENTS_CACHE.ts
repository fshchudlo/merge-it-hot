import { PullRequestCommentSnapshot } from "../../../../core/ports/SlackTargetedChannel";
import { CacheMetricsWrapper } from "./cache-metrics-wrapper/CacheMetricsWrapper";

export const COMMENTS_CACHE =
    new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");
