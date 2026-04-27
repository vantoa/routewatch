import { RouteInfo } from "./scanner";

export interface SymmetryIssue {
  path: string;
  presentMethods: string[];
  missingMethods: string[];
  reason: string;
}

export interface SymmetryReport {
  issues: SymmetryIssue[];
  total: number;
  symmetric: number;
}

// Common method pairs that should typically appear together
const EXPECTED_PAIRS: [string, string][] = [
  ["POST", "GET"],
  ["PUT", "GET"],
  ["PATCH", "GET"],
  ["DELETE", "GET"],
];

const CRUD_SET = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export function detectSymmetryIssues(routes: RouteInfo[]): SymmetryIssue[] {
  const issues: SymmetryIssue[] = [];

  for (const route of routes) {
    const methods = new Set(route.methods.map((m) => m.toUpperCase()));
    const missing: string[] = [];

    for (const [write, read] of EXPECTED_PAIRS) {
      if (methods.has(write) && !methods.has(read)) {
        missing.push(read);
      }
    }

    if (missing.length > 0) {
      issues.push({
        path: route.path,
        presentMethods: Array.from(methods),
        missingMethods: [...new Set(missing)],
        reason: `Route supports write operations (${[...methods]
          .filter((m) => CRUD_SET.has(m) && m !== "GET")
          .join(", ")}) but is missing GET`,
      });
    }
  }

  return issues;
}

export function buildSymmetryReport(routes: RouteInfo[]): SymmetryReport {
  const issues = detectSymmetryIssues(routes);
  return {
    issues,
    total: routes.length,
    symmetric: routes.length - issues.length,
  };
}

export function formatSymmetryReport(report: SymmetryReport): string {
  const lines: string[] = [];
  lines.push("=== Route Symmetry Report ===");
  lines.push(
    `Symmetric: ${report.symmetric}/${report.total} routes\n`
  );

  if (report.issues.length === 0) {
    lines.push("✓ All routes appear symmetric.");
    return lines.join("\n");
  }

  for (const issue of report.issues) {
    lines.push(`  ✗ ${issue.path}`);
    lines.push(`    Present : ${issue.presentMethods.join(", ")}`);
    lines.push(`    Missing : ${issue.missingMethods.join(", ")}`);
    lines.push(`    Reason  : ${issue.reason}`);
  }

  return lines.join("\n");
}
