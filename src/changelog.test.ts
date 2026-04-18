import { buildChangelog, formatChangelog, appendChangelog } from './changelog';
import type { RouteChange } from './differ';

const added: RouteChange = { route: '/api/posts', methods: ['GET', 'POST'], status: 'added' };
const removed: RouteChange = { route: '/api/old', methods: ['DELETE'], status: 'removed' };
const modified: RouteChange = {
  route: '/api/users',
  methods: ['GET'],
  status: 'modified',
  methodsBefore: ['GET', 'POST'],
  methodsAfter: ['GET'],
};

describe('buildChangelog', () => {
  it('includes date and changes', () => {
    const entry = buildChangelog([added]);
    expect(entry.changes).toHaveLength(1);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.version).toBeUndefined();
  });

  it('includes version when provided', () => {
    const entry = buildChangelog([added], '1.2.0');
    expect(entry.version).toBe('1.2.0');
  });
});

describe('formatChangelog', () => {
  it('formats added routes under Added section', () => {
    const entry = buildChangelog([added], '1.0.0');
    const out = formatChangelog(entry);
    expect(out).toContain('## [1.0.0]');
    expect(out).toContain('### Added');
    expect(out).toContain('/api/posts');
  });

  it('formats removed routes under Removed section', () => {
    const out = formatChangelog(buildChangelog([removed]));
    expect(out).toContain('### Removed');
    expect(out).toContain('/api/old');
  });

  it('formats modified routes under Changed section', () => {
    const out = formatChangelog(buildChangelog([modified]));
    expect(out).toContain('### Changed');
    expect(out).toContain('/api/users');
  });

  it('omits empty sections', () => {
    const out = formatChangelog(buildChangelog([added]));
    expect(out).not.toContain('### Removed');
    expect(out).not.toContain('### Changed');
  });
});

describe('appendChangelog', () => {
  it('prepends new entry to existing content', () => {
    const existing = '## 2024-01-01\n### Added\n- old';
    const entry = buildChangelog([added], '2.0.0');
    const result = appendChangelog(existing, entry);
    expect(result.indexOf('[2.0.0]')).toBeLessThan(result.indexOf('2024-01-01'));
  });

  it('returns just new section when existing is empty', () => {
    const entry = buildChangelog([added]);
    const result = appendChangelog('', entry);
    expect(result).toBe(formatChangelog(entry));
  });
});
