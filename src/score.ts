import { RouteChange } from './differ';
import { getSeverity } from './severity';

export interface RouteScore {
  total: number;
  breaking: number;
  nonBreaking: number;
  added: number;
  removed: number;
  modified: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export function computeScore(changes: RouteChange[]): RouteScore {
  let breaking = 0;
  let nonBreaking = 0;
  let added = 0;
  let removed = 0;
  let modified = 0;

  for (const change of changes) {
    const sev = getSeverity(change);
    if (sev === 'breaking') breaking++;
    else nonBreaking++;

    if (change.type === 'added') added++;
    else if (change.type === 'removed') removed++;
    else modified++;
  }

  const total = changes.length;
  const grade = deriveGrade(breaking, total);

  return { total, breaking, nonBreaking, added, removed, modified, grade };
}

function deriveGrade(breaking: number, total: number): RouteScore['grade'] {
  if (total === 0) return 'A';
  const ratio = breaking / total;
  if (ratio === 0) return 'A';
  if (ratio <= 0.1) return 'B';
  if (ratio <= 0.25) return 'C';
  if (ratio <= 0.5) return 'D';
  return 'F';
}

export function formatScore(score: RouteScore): string {
  const lines: string[] = [
    `Grade: ${score.grade}`,
    `Total changes: ${score.total}`,
    `  Breaking:     ${score.breaking}`,
    `  Non-breaking: ${score.nonBreaking}`,
    `  Added:        ${score.added}`,
    `  Removed:      ${score.removed}`,
    `  Modified:     ${score.modified}`,
  ];
  return lines.join('\n');
}
