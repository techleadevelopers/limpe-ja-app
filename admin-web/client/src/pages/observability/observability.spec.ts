import { describe, expect, it } from "vitest";
import { buildLatencyChartData } from "./observability";
import type { ObservabilityLatencyPoint } from "@/lib/types";

describe("buildLatencyChartData", () => {
  it("maps latency series entries into chart data", () => {
    const series: ObservabilityLatencyPoint[] = [
      { timestamp: "2024-01-01T00:00:00.000Z", latencyMs: 42.7 },
      { timestamp: "2024-01-01T01:00:00.000Z", latencyMs: 55.1 },
    ];

    const chartData = buildLatencyChartData(series);

    expect(chartData.length).toBe(series.length);
    expect(chartData.every((entry, index) => entry.latency === series[index].latencyMs)).toBe(true);
    expect(chartData.every((entry) => typeof entry.label === "string")).toBe(true);
  });

  it("returns empty array when there is no series", () => {
    expect(buildLatencyChartData(undefined)).toEqual([]);
  });
});
