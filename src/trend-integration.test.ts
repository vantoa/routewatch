import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildTrendEntry, buildTrendReport, formatTrendReport } from './trend';

describe('trend integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trend-int-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('builds and formats a multi-entry trend report', () => {
    const entries = [
      buildTrendEntry('2024-01-01', { added: [{ path: '/a', methods: ['GET'] }], removed: [], modified: [] }, 5),
      buildTrendEntry('2024-01-02', { added: [], removed: [{ path: '/b', methods: ['POST'] }], modified: [] }, 4),
      buildTrendEntry('2024-01-03', { added: [], removed: [], modified: [{ path: '/c', methods: ['PUT'], oldMethods: ['GET'] }] }, 4),
    ];
    const report = buildTrendReport(entries);
    expect(report.entries).toHaveLength(3);
    expect(report.totalAdded).toBe(1);
    expect(report.totalRemoved).toBe(1);
    expect(report.totalModified).toBe(1);
    const formatted = formatTrendReport(report);
    expect(formatted).toContain('2024-01-01');
    expect(formatted).toContain('2024-01-03');
  });

  it('persists trend entries to disk and reloads them', () => {
    const filePath = path.join(tmpDir, 'trend.json');
    const entries = [
      buildTrendEntry('2024-02-01', { added: [], removed: [], modified: [] }, 3),
    ];
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
    const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const report = buildTrendReport(loaded);
    expect(report.entries).toHaveLength(1);
    expect(report.totalAdded).toBe(0);
  });
});
