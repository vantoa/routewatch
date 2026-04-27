import { RouteInfo } from './scanner';

export interface NamingViolation {
  path: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface NamingReport {
  violations: NamingViolation[];
  total: number;
  errorCount: number;
  warningCount: number;
}

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DYNAMIC_SEGMENT = /^\[(\.\.\.)?[a-zA-Z][a-zA-Z0-9]*\]$/;
const UPPERCASE_RE = /[A-Z]/;
const UNDERSCORE_RE = /_/;

export function checkSegment(segment: string): NamingViolation | null {
  if (DYNAMIC_SEGMENT.test(segment)) return null;
  if (segment.startsWith('(') && segment.endsWith(')')) return null; // route groups
  if (UPPERCASE_RE.test(segment)) {
    return {
      path: segment,
      rule: 'no-uppercase',
      message: `Segment "${segment}" contains uppercase letters; use kebab-case`,
      severity: 'error',
    };
  }
  if (UNDERSCORE_RE.test(segment) && !segment.startsWith('_')) {
    return {
      path: segment,
      rule: 'no-underscore',
      message: `Segment "${segment}" contains underscores; use kebab-case`,
      severity: 'warning',
    };
  }
  if (!KEBAB_CASE.test(segment) && !segment.startsWith('[') && !segment.startsWith('_')) {
    return {
      path: segment,
      rule: 'kebab-case',
      message: `Segment "${segment}" is not valid kebab-case`,
      severity: 'warning',
    };
  }
  return null;
}

export function auditRouteNaming(routes: RouteInfo[]): NamingReport {
  const violations: NamingViolation[] = [];

  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);
    for (const seg of segments) {
      const v = checkSegment(seg);
      if (v) {
        violations.push({ ...v, path: route.path });
      }
    }
  }

  return {
    violations,
    total: violations.length,
    errorCount: violations.filter((v) => v.severity === 'error').length,
    warningCount: violations.filter((v) => v.severity === 'warning').length,
  };
}

export function formatNamingReport(report: NamingReport): string {
  if (report.total === 0) return 'No naming violations found.';
  const lines: string[] = [
    `Naming violations: ${report.total} (${report.errorCount} errors, ${report.warningCount} warnings)`,
    '',
  ];
  for (const v of report.violations) {
    const icon = v.severity === 'error' ? '✖' : '⚠';
    lines.push(`  ${icon} [${v.rule}] ${v.path} — ${v.message}`);
  }
  return lines.join('\n');
}
