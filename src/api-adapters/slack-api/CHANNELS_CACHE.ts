import { SlackChannelInfo } from "./SlackChannelProvisioner";
import { CacheMetricsWrapper } from "../cache-metrics-wrapper/CacheMetricsWrapper";

export const CHANNELS_CACHE = new CacheMetricsWrapper<SlackChannelInfo>("channels");