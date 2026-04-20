import { RouteInfo } from './scanner';

export interface SimilarityPair {
  a: string;
  b: string;
  score: number;
  sharedMethods: string[];
}

export interface SimilarityReport {
  pairs: SimilarityPair[];
  threshold: number;
}

function segmentize(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']');
}

export function pathSimilarity(a: string, b: string): number {
  const segsA = segmentize(a);
  const segsB = segmentize(b);
  if (segsA.length === 0 && segsB.length === 0) return 1;
  const maxLen = Math.max(segsA.length, segsB.length);
  if (maxLen === 0) return 1;
  let matches = 0;
  const minLen = Math.min(segsA.length, segsB.length);
  for (let i = 0; i < minLen; i++) {
    const sa = segsA[i];
    const sb = segsB[i];
    if (sa === sb) {
      matches += 1;
    } else if (isDynamic(sa) && isDynamic(sb)) {
      matches += 0.8;
    } else if (isDynamic(sa) || isDynamic(sb)) {
      matches += 0.4;
    }
  }
  return matches / maxLen;
}

export function sharedMethods(a: RouteInfo, b: RouteInfo): string[] {
  return a.methods.filter((m) => b.methods.includes(m));
}

export function computeSimilarity(
  routes: RouteInfo[],
  threshold = 0.7
): SimilarityReport {
  const pairs: SimilarityPair[] = [];
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const score = pathSimilarity(routes[i].route, routes[j].route);
      if (score >= threshold) {
        pairs.push({
          a: routes[i].route,
          b: routes[j].route,
          score: Math.round(score * 100) / 100,
          sharedMethods: sharedMethods(routes[i], routes[j]),
        });
      }
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  return { pairs, threshold };
}

export function formatSimilarityReport(report: SimilarityReport): string {
  if (report.pairs.length === 0) {
    return `No similar route pairs found above threshold ${report.threshold}.\n`;
  }
  const lines: string[] = [
    `Similar routes (threshold: ${report.threshold}):`,
    '',
  ];
  for (const p of report.pairs) {
    const methods = p.sharedMethods.length
      ? ` [shared: ${p.sharedMethods.join(', ')}]`
      : '';
    lines.push(`  ${p.a}  <->  ${p.b}  (score: ${p.score})${methods}`);
  }
  return lines.join('\n') + '\n';
}
