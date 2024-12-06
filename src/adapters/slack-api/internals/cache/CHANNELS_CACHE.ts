import { CacheMetricsWrapper } from "./cache-metrics-wrapper/CacheMetricsWrapper";
import { SlackChannelInfo } from "../../../../core/ports/SlackTargetedChannel";

export const CHANNELS_CACHE = new CacheMetricsWrapper<SlackChannelInfo>(
    "channels",
);
