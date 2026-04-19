import { RouteChange } from './differ';
import { hasBreakingChanges } from './severity';

export type NotifyLevel = 'all' | 'breaking' | 'none';

export interface NotifyOptions {
  level: NotifyLevel;
  webhook?: string;
  email?: string;
}

export interface NotifyPayload {
  timestamp: string;
  totalChanges: number;
  hasBreaking: boolean;
  changes: RouteChange[];
}

export function buildPayload(changes: RouteChange[]): NotifyPayload {
  return {
    timestamp: new Date().toISOString(),
    totalChanges: changes.length,
    hasBreaking: hasBreakingChanges(changes),
    changes,
  };
}

export function shouldNotify(changes: RouteChange[], level: NotifyLevel): boolean {
  if (level === 'none') return false;
  if (level === 'breaking') return hasBreakingChanges(changes);
  return changes.length > 0;
}

export async function sendWebhook(url: string, payload: NotifyPayload): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${res.statusText}`);
  }
}

export async function notify(changes: RouteChange[], options: NotifyOptions): Promise<void> {
  if (!shouldNotify(changes, options.level)) return;
  const payload = buildPayload(changes);
  if (options.webhook) {
    await sendWebhook(options.webhook, payload);
  }
}
