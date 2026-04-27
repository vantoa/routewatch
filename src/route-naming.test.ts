import { describe, it, expect } from 'vitest';
import {
  checkSegment,
  auditRouteNaming,
  formatNamingReport,
  NamingReport,
} from './route-naming';
import { RouteInfo } from './scanner';

function makeRoute(path: string): RouteInfo {
  return { path, methods: ['GET'] };
}

describe('checkSegment', () => {
  it('returns null for valid kebab-case', () => {
    expect(checkSegment('user-profile')).toBeNull();
    expect(checkSegment('orders')).toBeNull();
  });

  it('returns null for dynamic segments', () => {
    expect(checkSegment('[id]')).toBeNull();
    expect(checkSegment('[...slug]')).toBeNull();
  });

  it('returns null for route groups', () => {
    expect(checkSegment('(auth)')).toBeNull();
  });

  it('flags uppercase letters as error', () => {
    const v = checkSegment('UserProfile');
    expect(v).not.toBeNull();
    expect(v!.rule).toBe('no-uppercase');
    expect(v!.severity).toBe('error');
  });

  it('flags underscores as warning', () => {
    const v = checkSegment('user_profile');
    expect(v).not.toBeNull();
    expect(v!.rule).toBe('no-underscore');
    expect(v!.severity).toBe('warning');
  });

  it('flags non-kebab segments as warning', () => {
    const v = checkSegment('user.profile');
    expect(v).not.toBeNull();
    expect(v!.rule).toBe('kebab-case');
  });
});

describe('auditRouteNaming', () => {
  it('returns empty report for clean routes', () => {
    const routes = [makeRoute('/api/user-profile'), makeRoute('/api/orders/[id]')];
    const report = auditRouteNaming(routes);
    expect(report.total).toBe(0);
    expect(report.errorCount).toBe(0);
  });

  it('detects uppercase violation', () => {
    const routes = [makeRoute('/api/UserOrders')];
    const report = auditRouteNaming(routes);
    expect(report.errorCount).toBeGreaterThan(0);
  });

  it('counts errors and warnings separately', () => {
    const routes = [makeRoute('/api/UserOrders/user_data')];
    const report = auditRouteNaming(routes);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(1);
  });
});

describe('formatNamingReport', () => {
  it('returns clean message when no violations', () => {
    const report: NamingReport = { violations: [], total: 0, errorCount: 0, warningCount: 0 };
    expect(formatNamingReport(report)).toBe('No naming violations found.');
  });

  it('formats violations with icons', () => {
    const routes = [makeRoute('/api/BadRoute')];
    const report = auditRouteNaming(routes);
    const output = formatNamingReport(report);
    expect(output).toContain('✖');
    expect(output).toContain('no-uppercase');
  });
});
