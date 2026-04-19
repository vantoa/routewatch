import { computeHealth, formatHealth } from './health';
import { RouteChange } from './differ';

const added: RouteChange = { type: 'added', route: '/a', methods: ['GET'] };
const removed: RouteChange = { type: 'removed', route: '/b', methods: ['POST'] };
const modified: RouteChange = { type: 'modified', route: '/c', methods: ['PUT'], oldMethods: ['GET'] };

describe('computeHealth', () => {
  it('returns perfect score with no changes', () => {
    const r = computeHealth([]);
    expect(r.score).toBe(100);
    expect(r.grade).toBe('A');
    expect(r.stable).toBe(true);
    expect(r.breaking).toBe(false);
  });

  it('penalises removed routes', () => {
    const r = computeHealth([removed]);
    expect(r.score).toBeLessThan(100);
    expect(r.removed).toBe(1);
    expect(r.stable).toBe(false);
  });

  it('marks breaking when breaking changes exist', () => {
    const r = computeHealth([removed]);
    expect(r.breaking).toBe(true);
  });

  it('counts added routes without heavy penalty', () => {
    const r = computeHealth([added]);
    expect(r.score).toBe(100);
    expect(r.added).toBe(1);
    expect(r.stable).toBe(true);
  });

  it('penalises modified routes lightly', () => {
    const r = computeHealth([modified]);
    expect(r.score).toBeLessThan(100);
    expect(r.modified).toBe(1);
  });

  it('score does not go below 0', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...removed,
      route: `/r${i}`,
    }));
    const r = computeHealth(many);
    expect(r.score).toBe(0);
    expect(r.grade).toBe('F');
  });
});

describe('formatHealth', () => {
  it('returns a string containing grade and score', () => {
    const r = computeHealth([added]);
    const out = formatHealth(r);
    expect(out).toContain('Grade');
    expect(out).toContain('Score');
    expect(out).toContain('100');
  });
});
