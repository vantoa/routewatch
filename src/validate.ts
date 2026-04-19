import { RouteInfo } from './scanner';

export interface ValidationRule {
  name: string;
  check: (route: RouteInfo) => string | null;
}

export interface ValidationResult {
  route: string;
  violations: string[];
}

export interface ValidationReport {
  results: ValidationResult[];
  totalViolations: number;
  valid: boolean;
}

const builtinRules: ValidationRule[] = [
  {
    name: 'no-uppercase',
    check: (r) =>
      /[A-Z]/.test(r.route) ? `Route "${r.route}" contains uppercase letters` : null,
  },
  {
    name: 'no-trailing-slash',
    check: (r) =>
      r.route !== '/' && r.route.endsWith('/')
        ? `Route "${r.route}" has a trailing slash`
        : null,
  },
  {
    name: 'has-methods',
    check: (r) =>
      r.methods.length === 0 ? `Route "${r.route}" exports no HTTP methods` : null,
  },
  {
    name: 'no-double-slash',
    check: (r) =>
      r.route.includes('//')
        ? `Route "${r.route}" contains consecutive slashes`
        : null,
  },
];

export function validateRoutes(
  routes: RouteInfo[],
  rules: ValidationRule[] = builtinRules
): ValidationReport {
  const results: ValidationResult[] = [];

  for (const route of routes) {
    const violations: string[] = [];
    for (const rule of rules) {
      const msg = rule.check(route);
      if (msg) violations.push(msg);
    }
    if (violations.length > 0) results.push({ route: route.route, violations });
  }

  const totalViolations = results.reduce((s, r) => s + r.violations.length, 0);
  return { results, totalViolations, valid: totalViolations === 0 };
}

export function formatValidationReport(report: ValidationReport): string {
  if (report.valid) return '✅ All routes passed validation.';
  const lines: string[] = [`❌ ${report.totalViolations} violation(s) found:\n`];
  for (const r of report.results) {
    lines.push(`  ${r.route}`);
    for (const v of r.violations) lines.push(`    - ${v}`);
  }
  return lines.join('\n');
}

/**
 * Returns only the validation results that contain violations for a specific rule.
 * Useful for filtering reports when you care about one rule at a time.
 */
export function filterByRule(
  report: ValidationReport,
  ruleName: string
): ValidationResult[] {
  return report.results
    .map((r) => ({
      route: r.route,
      violations: r.violations.filter((v) =>
        v.toLowerCase().includes(ruleName.toLowerCase())
      ),
    }))
    .filter((r) => r.violations.length > 0);
}
