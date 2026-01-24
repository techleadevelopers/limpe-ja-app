import { describe, expect, it } from "vitest";
import { buildLatencyChartData } from "./observability";
import type { ObservabilityLatencyPoint } from "@/lib/types";

describe("buildLatencyChartData", () => {
  it("maps multi-route latency entries into chart-ready points", () => {
    const series: ObservabilityLatencyPoint[] = [
      {
        timestamp: "2024-01-01T00:00:00.000Z",
        registerLatency: 42.7,
        radiusLatency: 35.2,
        bookingLatency: 28.4,
        paymentLatency: 18.9,
        criticalAverage: 31.3,
      },
      {
        timestamp: "2024-01-01T01:00:00.000Z",
        registerLatency: 51.1,
      },
    ];

    const chartData = buildLatencyChartData(series);

    expect(chartData.length).toBe(series.length);
    expect(chartData[0]).toMatchObject({
      registerLatency: 42.7,
      radiusLatency: 35.2,
      bookingLatency: 28.4,
      paymentLatency: 18.9,
      criticalAverage: 31.3,
    });
    expect(typeof chartData[0].label).toBe("string");
    expect(chartData[1]).toMatchObject({
      registerLatency: 51.1,
      radiusLatency: null,
    });
  });

  it("returns empty array when there is no series", () => {
    expect(buildLatencyChartData(undefined)).toEqual([]);
  });
});
