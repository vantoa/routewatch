import { RouteInfo } from "./scanner";

export interface RouteCluster {
  id: string;
  label: string;
  routes: RouteInfo[];
}

export interface ClusterReport {
  clusters: RouteCluster[];
  singletons: RouteInfo[];
  totalClusters: number;
  totalSingletons: number;
}

function topSegment(path: string): string {
  const parts = path.replace(/^\//, "").split("/");
  return parts[0] || "/";
}

function normalizeSegment(seg: string): string {
  // treat dynamic segments as a generic placeholder
  return seg.startsWith("[") ? "[param]" : seg;
}

function clusterKey(path: string, depth: number): string {
  const parts = path.replace(/^\//, "").split("/").slice(0, depth);
  return "/" + parts.map(normalizeSegment).join("/");
}

export function clusterRoutes(
  routes: RouteInfo[],
  depth: number = 2
): ClusterReport {
  const map = new Map<string, RouteInfo[]>();

  for (const route of routes) {
    const key = clusterKey(route.path, depth);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(route);
  }

  const clusters: RouteCluster[] = [];
  const singletons: RouteInfo[] = [];

  let idx = 0;
  for (const [key, members] of map.entries()) {
    if (members.length > 1) {
      clusters.push({
        id: `cluster-${idx++}`,
        label: key,
        routes: members,
      });
    } else {
      singletons.push(...members);
    }
  }

  return {
    clusters,
    singletons,
    totalClusters: clusters.length,
    totalSingletons: singletons.length,
  };
}

export function formatClusterReport(report: ClusterReport): string {
  const lines: string[] = [];
  lines.push(`Route Clusters (${report.totalClusters} clusters, ${report.totalSingletons} singletons)`);
  lines.push("");

  for (const cluster of report.clusters) {
    lines.push(`  ${cluster.label}  (${cluster.routes.length} routes)`);
    for (const r of cluster.routes) {
      lines.push(`    ${r.path}  [${r.methods.join(", ")}]`);
    }
    lines.push("");
  }

  if (report.singletons.length > 0) {
    lines.push(`  Singletons:`);
    for (const r of report.singletons) {
      lines.push(`    ${r.path}  [${r.methods.join(", ")}]`);
    }
  }

  return lines.join("\n");
}
