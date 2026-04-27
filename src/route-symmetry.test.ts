import {
  detectSymmetryIssues,
  buildSymmetryReport,
  formatSymmetryReport,
} from "./route-symmetry";
import { RouteInfo } from "./scanner";

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods, file: `app${path}/route.ts` };
}

describe("detectSymmetryIssues", () => {
  it("returns no issues for a fully symmetric route", () => {
    const routes = [makeRoute("/api/users", ["GET", "POST"])];
    expect(detectSymmetryIssues(routes)).toHaveLength(0);
  });

  it("flags POST without GET", () => {
    const routes = [makeRoute("/api/items", ["POST"])];
    const issues = detectSymmetryIssues(routes);
    expect(issues).toHaveLength(1);
    expect(issues[0].missingMethods).toContain("GET");
    expect(issues[0].path).toBe("/api/items");
  });

  it("flags DELETE without GET", () => {
    const routes = [makeRoute("/api/items/[id]", ["DELETE"])];
    const issues = detectSymmetryIssues(routes);
    expect(issues).toHaveLength(1);
    expect(issues[0].missingMethods).toContain("GET");
  });

  it("does not flag GET-only routes", () => {
    const routes = [makeRoute("/api/health", ["GET"])];
    expect(detectSymmetryIssues(routes)).toHaveLength(0);
  });

  it("handles mixed case methods", () => {
    const routes = [makeRoute("/api/orders", ["post", "put"])];
    const issues = detectSymmetryIssues(routes);
    expect(issues).toHaveLength(1);
    expect(issues[0].missingMethods).toContain("GET");
  });

  it("deduplicates missing methods across multiple pairs", () => {
    const routes = [makeRoute("/api/products", ["POST", "PUT", "PATCH"])];
    const issues = detectSymmetryIssues(routes);
    expect(issues).toHaveLength(1);
    const missing = issues[0].missingMethods;
    expect(missing.filter((m) => m === "GET")).toHaveLength(1);
  });
});

describe("buildSymmetryReport", () => {
  it("counts symmetric and total correctly", () => {
    const routes = [
      makeRoute("/api/a", ["GET", "POST"]),
      makeRoute("/api/b", ["POST"]),
    ];
    const report = buildSymmetryReport(routes);
    expect(report.total).toBe(2);
    expect(report.symmetric).toBe(1);
    expect(report.issues).toHaveLength(1);
  });
});

describe("formatSymmetryReport", () => {
  it("shows all-clear message when no issues", () => {
    const report = buildSymmetryReport([makeRoute("/api/x", ["GET"])]);
    expect(formatSymmetryReport(report)).toContain("symmetric");
  });

  it("includes path and missing methods in output", () => {
    const report = buildSymmetryReport([makeRoute("/api/y", ["DELETE"])]);
    const output = formatSymmetryReport(report);
    expect(output).toContain("/api/y");
    expect(output).toContain("GET");
  });
});
