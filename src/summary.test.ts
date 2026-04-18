import { generateSummary, formatSummary } from './summary';
import { DiffResult } from './differ';

const baseDiff: DiffResult[] = [
  { type: 'added', route: '/api/users', methods: ['GET', 'POST'] },
  { type: 'removed', route: '/api/legacy', methods: ['GET'] },
  { type: 'modified', route: '/api/posts', addedMethods: ['DELETE'], removedMethods: [] },
  { type: 'modified', route: '/api/comments', addedMethods: [], removedMethods: ['PUT'] },
];

describe('generateSummary', () => {
  it('counts added, removed, modified correctly', () => {
    const s = generateSummary(baseDiff);
    expect(s.added).toBe(1);
    expect(s.removed).toBe(1);
    expect(s.modified).toBe(2);
  });

  it('detects breaking changes when methods are removed', () => {
    const s = generateSummary(baseDiff);
    expect(s.breaking).toBe(true);
  });

  it('returns no breaking changes when only additions', () => {
    const onlyAdded: DiffResult[] = [
      { type: 'added', route: '/api/new', methods: ['GET'] },
    ];
    const s = generateSummary(onlyAdded);
    expect(s.breaking).toBe(false);
  });

  it('lists top modified routes (max 5)', () => {
    const s = generateSummary(baseDiff);
    expect(s.topChanged).toContain('/api/posts');
    expect(s.topChanged.length).toBeLessThanOrEqual(5);
  });

  it('populates severityCounts', () => {
    const s = generateSummary(baseDiff);
    expect(typeof s.severityCounts).toBe('object');
  });
});

describe('formatSummary', () => {
  it('includes header and key fields', () => {
    const s = generateSummary(baseDiff);
    const out = formatSummary(s);
    expect(out).toContain('Route Summary');
    expect(out).toContain('Added:');
    expect(out).toContain('Breaking changes:');
  });

  it('shows YES for breaking changes', () => {
    const s = generateSummary(baseDiff);
    const out = formatSummary(s);
    expect(out).toContain('YES');
  });
});
