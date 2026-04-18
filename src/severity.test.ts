import { getSeverity, classifyChanges, hasBreakingChanges, SeverityRule } from './severity';

describe('getSeverity', () => {
  it('returns breaking for removed route', () => {
    expect(getSeverity('removed')).toBe('breaking');
  });

  it('returns breaking for method_removed', () => {
    expect(getSeverity('method_removed')).toBe('breaking');
  });

  it('returns info for added route', () => {
    expect(getSeverity('added')).toBe('info');
  });

  it('returns info for method_added', () => {
    expect(getSeverity('method_added')).toBe('info');
  });

  it('respects custom rules', () => {
    const rules: SeverityRule[] = [{ type: 'added', severity: 'warning' }];
    expect(getSeverity('added', rules)).toBe('warning');
  });

  it('falls back to info for unknown type with empty rules', () => {
    expect(getSeverity('added', [])).toBe('info');
  });
});

describe('classifyChanges', () => {
  it('annotates each change with severity', () => {
    const changes = [
      { type: 'removed' as const, route: '/api/users' },
      { type: 'added' as const, route: '/api/posts' },
    ];
    const result = classifyChanges(changes);
    expect(result[0].severity).toBe('breaking');
    expect(result[1].severity).toBe('info');
  });
});

describe('hasBreakingChanges', () => {
  it('returns true when breaking change present', () => {
    expect(hasBreakingChanges([{ severity: 'breaking' }, { severity: 'info' }])).toBe(true);
  });

  it('returns false when no breaking changes', () => {
    expect(hasBreakingChanges([{ severity: 'info' }, { severity: 'warning' }])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasBreakingChanges([])).toBe(false);
  });
});
