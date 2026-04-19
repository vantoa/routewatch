import { computeScore, formatScore } from './score';
import { RouteChange } from './differ';

const added: RouteChange = { type: 'added', route: '/api/new', methods: ['GET'] };
const removed: RouteChange = { type: 'removed', route: '/api/old', methods: ['POST'] };
const modified: RouteChange = { type: 'modified', route: '/api/x', methodsAdded: ['DELETE'], methodsRemoved: [] };

describe('computeScore', () => {
  it('returns zeroed score for empty changes', () => {
    const score = computeScore([]);
    expect(score.total).toBe(0);
    expect(score.grade).toBe('A');
  });

  it('counts added routes', () => {
    const score = computeScore([added]);
    expect(score.added).toBe(1);
    expect(score.total).toBe(1);
  });

  it('counts removed routes', () => {
    const score = computeScore([removed]);
    expect(score.removed).toBe(1);
    expect(score.breaking).toBeGreaterThanOrEqual(1);
  });

  it('counts modified routes', () => {
    const score = computeScore([modified]);
    expect(score.modified).toBe(1);
  });

  it('assigns F grade when all changes are breaking', () => {
    const changes = Array(5).fill(removed);
    const score = computeScore(changes);
    expect(score.grade).toBe('F');
  });

  it('assigns A grade when no breaking changes', () => {
    const score = computeScore([added]);
    expect(score.grade).toBe('A');
  });
});

describe('formatScore', () => {
  it('includes grade in output', () => {
    const score = computeScore([added]);
    const out = formatScore(score);
    expect(out).toContain('Grade:');
    expect(out).toContain('Total changes: 1');
  });
});
