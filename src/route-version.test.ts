import {
  extractVersion,
  buildVersionReport,
  detectVersionChanges,
  formatVersionReport,
} from './route-version';
import { RouteChange } from './differ';

const makeRoute = (path: string, methods: string[] = ['GET']) => ({ path, methods });

describe('extractVersion', () => {
  it('extracts version from versioned path', () => {
    expect(extractVersion('/api/v1/users')).toBe('v1');
    expect(extractVersion('/api/v2/posts/[id]')).toBe('v2');
    expect(extractVersion('/v10/health')).toBe('v10');
  });

  it('returns null for unversioned paths', () => {
    expect(extractVersion('/api/users')).toBeNull();
    expect(extractVersion('/health')).toBeNull();
    expect(extractVersion('/api/avatar')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(extractVersion('/api/V3/items')).toBe('v3');
  });
});

describe('buildVersionReport', () => {
  it('groups routes by version', () => {
    const routes = [
      makeRoute('/api/v1/users'),
      makeRoute('/api/v1/posts'),
      makeRoute('/api/v2/users'),
      makeRoute('/api/health'),
    ];
    const report = buildVersionReport(routes);
    expect(report.groups).toHaveLength(2);
    expect(report.groups[0].version).toBe('v1');
    expect(report.groups[0].count).toBe(2);
    expect(report.groups[1].version).toBe('v2');
    expect(report.groups[1].count).toBe(1);
    expect(report.unversioned).toHaveLength(1);
    expect(report.totalVersioned).toBe(3);
    expect(report.totalUnversioned).toBe(1);
  });

  it('handles all unversioned routes', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/posts')];
    const report = buildVersionReport(routes);
    expect(report.groups).toHaveLength(0);
    expect(report.unversioned).toHaveLength(2);
    expect(report.totalVersioned).toBe(0);
  });

  it('handles empty input', () => {
    const report = buildVersionReport([]);
    expect(report.groups).toHaveLength(0);
    expect(report.unversioned).toHaveLength(0);
  });
});

describe('detectVersionChanges', () => {
  it('annotates changes with version info', () => {
    const changes: RouteChange[] = [
      { path: '/api/v1/users', status: 'added', methods: ['GET'] },
      { path: '/api/health', status: 'removed', methods: ['GET'] },
    ];
    const result = detectVersionChanges(changes);
    expect(result[0].fromVersion).toBe('v1');
    expect(result[1].fromVersion).toBeNull();
  });
});

describe('formatVersionReport', () => {
  it('renders versioned and unversioned sections', () => {
    const routes = [makeRoute('/api/v1/users'), makeRoute('/api/health')];
    const report = buildVersionReport(routes);
    const output = formatVersionReport(report);
    expect(output).toContain('[v1]');
    expect(output).toContain('[unversioned]');
    expect(output).toContain('/api/v1/users');
    expect(output).toContain('Summary:');
  });

  it('shows message when no versioned routes', () => {
    const report = buildVersionReport([makeRoute('/api/health')]);
    const output = formatVersionReport(report);
    expect(output).toContain('No versioned routes found.');
  });
});
