export type Severity = 'breaking' | 'warning' | 'info';

export interface SeverityRule {
  type: 'removed' | 'added' | 'method_removed' | 'method_added';
  severity: Severity;
}

const DEFAULT_RULES: SeverityRule[] = [
  { type: 'removed', severity: 'breaking' },
  { type: 'method_removed', severity: 'breaking' },
  { type: 'added', severity: 'info' },
  { type: 'method_added', severity: 'info' },
];

export function getSeverity(
  changeType: SeverityRule['type'],
  rules: SeverityRule[] = DEFAULT_RULES
): Severity {
  const rule = rules.find((r) => r.type === changeType);
  return rule ? rule.severity : 'info';
}

export function classifyChanges(
  changes: { type: SeverityRule['type']; route: string }[],
  rules?: SeverityRule[]
): { route: string; type: SeverityRule['type']; severity: Severity }[] {
  return changes.map((change) => ({
    ...change,
    severity: getSeverity(change.type, rules),
  }));
}

export function hasBreakingChanges(
  changes: { severity: Severity }[]
): boolean {
  return changes.some((c) => c.severity === 'breaking');
}
