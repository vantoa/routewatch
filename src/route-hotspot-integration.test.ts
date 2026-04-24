import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { buildHotspotReport, formatHotspotReport } from "./route-hotspot";
import type { RouteChange } from "./differ";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "routewatch-hotspot-"));
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

function makeChange(
  path: string,
  method: string,
  type: "added" | "removed" | "modified",
  date: string
): RouteChange {
  return { path, method, type, date };
}

describe("route-hotspot integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it("identifies hotspots from a realistic change history", () => {
    const changes: RouteChange[] = [
      makeChange("/api/users", "GET", "modified", "2024-01-01"),
      makeChange("/api/users", "POST", "modified", "2024-01-05"),
      makeChange("/api/users", "GET", "modified", "2024-01-10"),
      makeChange("/api/orders", "GET", "added", "2024-01-02"),
      makeChange("/api/orders", "DELETE", "removed", "2024-01-08"),
      makeChange("/api/products", "GET", "added", "2024-01-03"),
    ];

    const report = buildHotspotReport(changes);

    expect(report.hotspots.length).toBeGreaterThan(0);
    // /api/users should be the top hotspot with 3 changes
    expect(report.hotspots[0].path).toBe("/api/users");
    expect(report.hotspots[0].changeCount).toBe(3);
  });

  it("formats hotspot report to a non-empty string", () => {
    const changes: RouteChange[] = [
      makeChange("/api/auth/login", "POST", "modified", "2024-02-01"),
      makeChange("/api/auth/login", "POST", "modified", "2024-02-15"),
      makeChange("/api/auth/logout", "POST", "added", "2024-02-10"),
    ];

    const report = buildHotspotReport(changes);
    const output = formatHotspotReport(report);

    expect(output).toContain("/api/auth/login");
    expect(output.length).toBeGreaterThan(0);
  });

  it("returns empty hotspots when there are no changes", () => {
    const report = buildHotspotReport([]);
    expect(report.hotspots).toHaveLength(0);
  });

  it("ranks routes by change frequency correctly", () => {
    const changes: RouteChange[] = [
      makeChange("/api/a", "GET", "modified", "2024-03-01"),
      makeChange("/api/b", "GET", "modified", "2024-03-01"),
      makeChange("/api/b", "POST", "added", "2024-03-02"),
      makeChange("/api/b", "DELETE", "removed", "2024-03-03"),
      makeChange("/api/c", "GET", "added", "2024-03-04"),
      makeChange("/api/c", "PUT", "modified", "2024-03-05"),
    ];

    const report = buildHotspotReport(changes);
    const paths = report.hotspots.map((h) => h.path);

    // /api/b has 3 changes, /api/c has 2, /api/a has 1
    expect(paths[0]).toBe("/api/b");
    expect(paths[1]).toBe("/api/c");
    expect(paths[2]).toBe("/api/a");
  });

  it("persists and reloads history from a JSON file", () => {
    const historyFile = path.join(tmpDir, "hotspot-history.json");
    const changes: RouteChange[] = [
      makeChange("/api/users", "GET", "modified", "2024-04-01"),
      makeChange("/api/users", "DELETE", "removed", "2024-04-10"),
    ];

    fs.writeFileSync(historyFile, JSON.stringify(changes), "utf-8");

    const loaded: RouteChange[] = JSON.parse(
      fs.readFileSync(historyFile, "utf-8")
    );
    const report = buildHotspotReport(loaded);

    expect(report.hotspots).toHaveLength(1);
    expect(report.hotspots[0].path).toBe("/api/users");
    expect(report.hotspots[0].changeCount).toBe(2);
  });
});
