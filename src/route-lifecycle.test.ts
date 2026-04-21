import { classifyLifecycle, buildLifecycleReport, formatLifecycleReport } from './route-lifecycle';
import { RouteChange } from './differ';

const added: RouteChange = {
  type: 'added',
  route: { path: '/api/users', methods: ['GET', 'POST'] },
};

const removed: RouteChange = {
  type: 'removed',
  route: { path: '/api/legacy', methods: ['GET'] },
};

const modified: RouteChange = {
  type: 'modified',
  route: { path: '/api/products', methods: ['GET'] },
  addedMethods: ['DELETE'],
  removedMethods: ['PUT'],
};

describe('classifyLifecycle', () => {
  it('marks added routes as new', () => {
    const entries = classifyLifecycle([added]);
    expect(entries[0].status).toBe('new');
    expect(entries[0].path).toBe('/api/users');
    expect(entries[0].methods).toEqual(['GET', 'POST']);
  });

  it('marks removed routes as removed', () => {
    const entries = classifyLifecycle([removed]);
    expect(entries[0].status).toBe('removed');
  });

  it('marks modified routes as modified with changed methods', () => {
    const entries = classifyLifecycle([modified]);
    expect(entries[0].status).toBe('modified');
    expect(entries[0].methods).toContain('DELETE');
    expect(entries[0].methods).toContain('PUT');
  });

  it('includes a since date', () => {
    const entries = classifyLifecycle([added]);
    expect(entries[0].since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('buildLifecycleReport', () => {
  it('includes all entries and a generatedAt timestamp', () => {
    const report = buildLifecycleReport([added, removed, modified]);
    expect(report.entries).toHaveLength(3);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('formatLifecycleReport', () => {
  it('renders section headers per status', () => {
    const report = buildLifecycleReport([added, removed]);
    const output = formatLifecycleReport(report);
    expect(output).toContain('## New');
    expect(output).toContain('## Removed');
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/legacy');
  });

  it('omits empty status sections', () => {
    const report = buildLifecycleReport([added]);
    const output = formatLifecycleReport(report);
    expect(output).not.toContain('## Removed');
    expect(output).not.toContain('## Stable');
  });

  it('includes generated timestamp', () => {
    const report = buildLifecycleReport([added]);
    const output = formatLifecycleReport(report);
    expect(output).toContain('Generated at:');
  });
});
