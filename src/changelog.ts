import { RouteChange } from './differ';
import { getSeverity } from './severity';

export interface ChangelogEntry {
  date: string;
  version?: string;
  changes: RouteChange[];
}

export function buildChangelog(
  changes: RouteChange[],
  version?: string
): ChangelogEntry {
  return {
    date: new Date().toISOString().split('T')[0],
    version,
    changes,
  };
}

export function formatChangelog(entry: ChangelogEntry): string {
  const lines: string[] = [];
  const header = entry.version
    ? `## [${entry.version}] - ${entry.date}`
    : `## ${entry.date}`;
  lines.push(header);

  const added = entry.changes.filter(c => c.status === 'added');
  const removed = entry.changes.filter(c => c.status === 'removed');
  const modified = entry.changes.filter(c => c.status === 'modified');

  if (added.length) {
    lines.push('### Added');
    added.forEach(c => lines.push(`- \`${c.route}\` [${c.methods.join(', ')}]`));
  }
  if (modified.length) {
    lines.push('### Changed');
    modified.forEach(c => {
      const sev = getSeverity(c);
      lines.push(`- \`${c.route}\` (${sev})`);
    });
  }
  if (removed.length) {
    lines.push('### Removed');
    removed.forEach(c => lines.push(`- \`${c.route}\` [${c.methods.join(', ')}]`));
  }

  return lines.join('\n');
}

export function appendChangelog(existing: string, entry: ChangelogEntry): string {
  const newSection = formatChangelog(entry);
  if (!existing.trim()) return newSection;
  return `${newSection}\n\n${existing}`;
}
