import client, { Counter, Gauge } from "prom-client";
import { createCache } from "cache-manager";

export class CacheMetricsWrapper<T> {
    private readonly cache: ReturnType<typeof createCache>;
    private readonly utilizedCacheSizeGauge: Gauge;
    private readonly cacheHitsCounter: Counter;
    private readonly cacheMissesCounter: Counter;

    constructor(metricsNamePrefix: string) {
        this.cache = createCache();
        this.cacheHitsCounter = new client.Counter({
            name: `${metricsNamePrefix}_cache_hits`,
            help: "Successful cache hits counter"
        });
        this.cacheMissesCounter = new client.Counter({
            name: `${metricsNamePrefix}_cache_misses`,
            help: "Missed cache hits counter"
        });
        this.utilizedCacheSizeGauge = new client.Gauge({
            name: `${metricsNamePrefix}_cache_utilized_size`,
            help: "Utilized cache size"
        });
    }

    async set(key: string, value: T): Promise<void> {
        await this.cache.set(key, value);
        this.utilizedCacheSizeGauge.inc();
    }

    async get(key: string): Promise<T | null> {
        const value = await this.cache.get<T>(key);
        value ? this.cacheHitsCounter.inc() : this.cacheMissesCounter.inc();
        return value;
    }

    async delete(key: string): Promise<void> {
        await this.cache.del(key);
        this.utilizedCacheSizeGauge.dec();
    }

    async clear(): Promise<void> {
        await this.cache.clear();
        this.utilizedCacheSizeGauge.set(0);
    }
}