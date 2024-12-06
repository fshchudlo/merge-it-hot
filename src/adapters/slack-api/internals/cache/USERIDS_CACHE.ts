import { CacheMetricsWrapper } from "./cache-metrics-wrapper/CacheMetricsWrapper";

export const USERIDS_CACHE = new CacheMetricsWrapper<string>("userIds");
