import { RouteChange } from './differ';

export type LifecycleStatus = 'stable' | 'new' | 'deprecated' | 'removed' | 'modified';

export interface LifecycleEntry {
  path: string;
  methods: string[];
  status: LifecycleStatus;
  since?: string;
  lastSeen?: string;
}

export interface LifecycleReport {
  entries: LifecycleEntry[];
  generatedAt: string;
}

export function classifyLifecycle(changes: RouteChange[]): LifecycleEntry[] {
  return changes.map((change) => {
    let status: LifecycleStatus;
    let methods: string[];

    switch (change.type) {
      case 'added':
        status = 'new';
        methods = change.route.methods;
        break;
      case 'removed':
        status = 'removed';
        methods = change.route.methods;
        break;
      case 'modified':
        status = 'modified';
        methods = [
          ...(change.addedMethods ?? []),
          ...(change.removedMethods ?? []),
        ];
        break;
      default:
        status = 'stable';
        methods = change.route.methods;
    }

    return {
      path: change.route.path,
      methods,
      status,
      since: new Date().toISOString().split('T')[0],
    };
  });
}

export function buildLifecycleReport(changes: RouteChange[]): LifecycleReport {
  return {
    entries: classifyLifecycle(changes),
    generatedAt: new Date().toISOString(),
  };
}

export function formatLifecycleReport(report: LifecycleReport): string {
  const lines: string[] = ['# Route Lifecycle Report', ''];
  const grouped: Record<LifecycleStatus, LifecycleEntry[]> = {
    new: [],
    removed: [],
    modified: [],
    deprecated: [],
    stable: [],
  };

  for (const entry of report.entries) {
    grouped[entry.status].push(entry);
  }

  const order: LifecycleStatus[] = ['new', 'removed', 'modified', 'deprecated', 'stable'];
  for (const status of order) {
    const entries = grouped[status];
    if (entries.length === 0) continue;
    lines.push(`## ${status.charAt(0).toUpperCase() + status.slice(1)} (${entries.length})`);
    for (const e of entries) {
      lines.push(`  - ${e.path} [${e.methods.join(', ')}]`);
    }
    lines.push('');
  }

  lines.push(`Generated at: ${report.generatedAt}`);
  return lines.join('\n');
}
