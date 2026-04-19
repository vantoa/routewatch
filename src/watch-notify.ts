import { RouteChange } from './differ';
import { buildPayload, shouldNotify } from './notify';
import { watchRoutes } from './watcher';
import axios from 'axios';

export interface WatchNotifyOptions {
  dir: string;
  webhookUrl: string;
  minSeverity?: 'info' | 'warning' | 'breaking';
  debounceMs?: number;
}

export async function startWatchNotify(options: WatchNotifyOptions): Promise<() => void> {
  const { dir, webhookUrl, minSeverity = 'info', debounceMs = 500 } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = watchRoutes(dir, (changes: RouteChange[]) => {
    if (!shouldNotify(changes, minSeverity)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const payload = buildPayload(changes);
      try {
        await axios.post(webhookUrl, payload);
      } catch (err) {
        console.error('[routewatch] Failed to send notification:', (err as Error).message);
      }
    }, debounceMs);
  });

  return () => {
    if (timer) clearTimeout(timer);
    stop();
  };
}
