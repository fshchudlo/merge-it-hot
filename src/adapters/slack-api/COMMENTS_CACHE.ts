import { PullRequestCommentSnapshot } from "../../use-cases/slack-api-ports";
import { CacheMetricsWrapper } from "./cache/CacheMetricsWrapper";

export const COMMENTS_CACHE = new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");