import { generateJsonReport, generateMarkdownReport, generateReport } from './reporter';
import { DiffResult } from './differ';

const emptyDiff: DiffResult = { added: [], removed: [], changed: [] };

const sampleDiff: DiffResult = {
  added: [{ path: '/api/users', methods: ['GET', 'POST'] }],
  removed: [{ path: '/api/legacy', methods: ['GET'] }],
  changed: [{ path: '/api/products', addedMethods: ['PATCH'], removedMethods: ['PUT'] }],
};

describe('generateJsonReport', () => {
  it('returns valid JSON string', () => {
    const result = generateJsonReport(sampleDiff);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('round-trips the diff object', () => {
    const result = JSON.parse(generateJsonReport(sampleDiff));
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(1);
    expect(result.changed).toHaveLength(1);
  });
});

describe('generateMarkdownReport', () => {
  it('returns no-changes message for empty diff', () => {
    const result = generateMarkdownReport(emptyDiff);
    expect(result).toContain('No route changes detected');
  });

  it('includes added routes section', () => {
    const result = generateMarkdownReport(sampleDiff);
    expect(result).toContain('## Added Routes');
    expect(result).toContain('/api/users');
  });

  it('includes removed routes section', () => {
    const result = generateMarkdownReport(sampleDiff);
    expect(result).toContain('## Removed Routes');
    expect(result).toContain('/api/legacy');
  });

  it('includes changed routes section with method details', () => {
    const result = generateMarkdownReport(sampleDiff);
    expect(result).toContain('## Changed Routes');
    expect(result).toContain('PATCH');
    expect(result).toContain('PUT');
  });
});

describe('generateReport', () => {
  it('generates text format by default', () => {
    const result = generateReport(emptyDiff, { format: 'text' });
    expect(typeof result).toBe('string');
  });

  it('generates json format', () => {
    const result = generateReport(sampleDiff, { format: 'json' });
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('generates markdown format', () => {
    const result = generateReport(sampleDiff, { format: 'markdown' });
    expect(result).toContain('#');
  });
});
