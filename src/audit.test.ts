import { buildAuditEntries, buildAuditReport, formatAuditReport } from './audit';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  {
    route: '/api/users',
    status: 'added',
    before: undefined,
    after: { route: '/api/users', methods: ['GET', 'POST'] },
  },
  {
    route: '/api/posts',
    status: 'removed',
    before: { route: '/api/posts', methods: ['GET'] },
    after: undefined,
  },
  {
    route: '/api/comments',
    status: 'modified',
    before: { route: '/api/comments', methods: ['GET', 'DELETE'] },
    after: { route: '/api/comments', methods: ['GET'] },
  },
];

describe('buildAuditEntries', () => {
  it('expands methods into individual entries', () => {
    const entries = buildAuditEntries(changes);
    // 2 (added) + 1 (removed) + 2 (modified before methods used) = 5
    expect(entries.length).toBe(5);
  });

  it('assigns correct status', () => {
    const entries = buildAuditEntries(changes);
    expect(entries.filter((e) => e.status === 'added').length).toBe(2);
    expect(entries.filter((e) => e.status === 'removed').length).toBe(1);
  });

  it('sets details for modified changes', () => {
    const entries = buildAuditEntries(changes);
    const modified = entries.filter((e) => e.status === 'modified');
    expect(modified.every((e) => e.details !== undefined)).toBe(true);
  });
});

describe('buildAuditReport', () => {
  it('returns correct totals', () => {
    const report = buildAuditReport(changes);
    expect(report.totalChanges).toBe(5);
    expect(typeof report.breakingCount).toBe('number');
    expect(report.entries.length).toBe(report.totalChanges);
  });

  it('includes generatedAt timestamp', () => {
    const report = buildAuditReport(changes);
    expect(report.generatedAt).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('formatAuditReport', () => {
  it('produces a non-empty string', () => {
    const report = buildAuditReport(changes);
    const output = formatAuditReport(report);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes route names', () => {
    const report = buildAuditReport(changes);
    const output = formatAuditReport(report);
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/posts');
  });
});
