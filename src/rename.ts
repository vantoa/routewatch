import { RouteInfo } from './scanner';

export interface RenameCandidate {
  from: string;
  to: string;
  confidence: number; // 0-1
  sharedMethods: string[];
}

function methodOverlap(a: string[], b: string[]): string[] {
  return a.filter(m => b.includes(m));
}

function similarity(a: string, b: string): number {
  const partsA = a.split('/').filter(Boolean);
  const partsB = b.split('/').filter(Boolean);
  const maxLen = Math.max(partsA.length, partsB.length);
  if (maxLen === 0) return 1;
  let matches = 0;
  const shorter = partsA.length <= partsB.length ? partsA : partsB;
  const longer = partsA.length > partsB.length ? partsA : partsB;
  for (let i = 0; i < shorter.length; i++) {
    const a = shorter[i].replace(/^\[.*\]$/, '__param__');
    const b = longer[i].replace(/^\[.*\]$/, '__param__');
    if (a === b) matches++;
  }
  return matches / maxLen;
}

export function detectRenames(
  removed: RouteInfo[],
  added: RouteInfo[],
  threshold = 0.5
): RenameCandidate[] {
  const candidates: RenameCandidate[] = [];
  for (const rem of removed) {
    for (const add of added) {
      const shared = methodOverlap(rem.methods, add.methods);
      if (shared.length === 0) continue;
      const sim = similarity(rem.route, add.route);
      const methodScore = shared.length / Math.max(rem.methods.length, add.methods.length);
      const confidence = (sim + methodScore) / 2;
      if (confidence >= threshold) {
        candidates.push({ from: rem.route, to: add.route, confidence, sharedMethods: shared });
      }
    }
  }
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}

export function formatRenameReport(candidates: RenameCandidate[]): string {
  if (candidates.length === 0) return 'No rename candidates detected.';
  const lines = ['Rename Candidates:', ''];
  for (const c of candidates) {
    const pct = Math.round(c.confidence * 100);
    lines.push(`  ${c.from} → ${c.to}  [${pct}% confidence, methods: ${c.sharedMethods.join(', ')}]`);
  }
  return lines.join('\n');
}
