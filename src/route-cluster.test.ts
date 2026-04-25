import { clusterRoutes, formatClusterReport } from "./route-cluster";
import { RouteInfo } from "./scanner";

function makeRoute(path: string, methods: string[] = ["GET"]): RouteInfo {
  return { path, methods, filePath: `app${path}/route.ts` };
}

describe("clusterRoutes", () => {
  const routes: RouteInfo[] = [
    makeRoute("/api/users"),
    makeRoute("/api/users/[id]"),
    makeRoute("/api/posts"),
    makeRoute("/api/posts/[id]"),
    makeRoute("/api/posts/[id]/comments"),
    makeRoute("/health"),
  ];

  it("groups routes sharing a common prefix at depth 2", () => {
    const report = clusterRoutes(routes, 2);
    const labels = report.clusters.map((c) => c.label);
    expect(labels).toContain("/api/users");
    expect(labels).toContain("/api/posts");
  });

  it("places routes with unique prefix into singletons", () => {
    const report = clusterRoutes(routes, 2);
    const singletonPaths = report.singletons.map((r) => r.path);
    expect(singletonPaths).toContain("/health");
  });

  it("counts clusters and singletons correctly", () => {
    const report = clusterRoutes(routes, 2);
    expect(report.totalClusters).toBe(2);
    expect(report.totalSingletons).toBe(1);
  });

  it("treats dynamic segments as equivalent when clustering", () => {
    const dynRoutes: RouteInfo[] = [
      makeRoute("/api/[id]/info"),
      makeRoute("/api/[slug]/info"),
    ];
    const report = clusterRoutes(dynRoutes, 2);
    expect(report.totalClusters).toBe(1);
    expect(report.clusters[0].routes).toHaveLength(2);
  });

  it("returns all as singletons when depth=1 and all top segments differ", () => {
    const unique: RouteInfo[] = [
      makeRoute("/alpha"),
      makeRoute("/beta"),
      makeRoute("/gamma"),
    ];
    const report = clusterRoutes(unique, 1);
    expect(report.totalClusters).toBe(0);
    expect(report.totalSingletons).toBe(3);
  });
});

describe("formatClusterReport", () => {
  it("includes cluster labels and route paths", () => {
    const routes: RouteInfo[] = [
      makeRoute("/api/users"),
      makeRoute("/api/users/[id]"),
      makeRoute("/standalone"),
    ];
    const report = clusterRoutes(routes, 2);
    const output = formatClusterReport(report);
    expect(output).toContain("/api/users");
    expect(output).toContain("Singletons");
    expect(output).toContain("/standalone");
  });

  it("shows method list for each route", () => {
    const routes: RouteInfo[] = [
      makeRoute("/api/a", ["GET", "POST"]),
      makeRoute("/api/b", ["DELETE"]),
    ];
    const report = clusterRoutes(routes, 2);
    const output = formatClusterReport(report);
    expect(output).toMatch(/GET.*POST|POST.*GET/);
  });
});
