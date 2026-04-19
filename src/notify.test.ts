import { buildPayload, shouldNotify, notify } from './notify';
import type { RouteChange } from './differ';

const added: RouteChange = { type: 'added', route: '/api/foo', methods: ['GET'] };
const removed: RouteChange = { type: 'removed', route: '/api/bar', methods: ['POST'] };

describe('buildPayload', () => {
  it('includes timestamp and counts', () => {
    const p = buildPayload([added]);
    expect(p.totalChanges).toBe(1);
    expect(p.hasBreaking).toBe(true);
    expect(typeof p.timestamp).toBe('string');
  });

  it('hasBreaking false when only additions', () => {
    const p = buildPayload([added]);
    // removed routes are breaking; added alone not
    const addOnly: RouteChange = { type: 'added', route: '/x', methods: ['GET'] };
    const p2 = buildPayload([addOnly]);
    expect(p2.hasBreaking).toBe(false);
  });
});

describe('shouldNotify', () => {
  it('returns false for none', () => {
    expect(shouldNotify([added], 'none')).toBe(false);
  });

  it('returns true for all when changes exist', () => {
    expect(shouldNotify([added], 'all')).toBe(true);
  });

  it('returns false for all when no changes', () => {
    expect(shouldNotify([], 'all')).toBe(false);
  });

  it('returns true for breaking only when breaking change present', () => {
    expect(shouldNotify([removed], 'breaking')).toBe(true);
  });

  it('returns false for breaking when no breaking changes', () => {
    const addOnly: RouteChange = { type: 'added', route: '/x', methods: ['GET'] };
    expect(shouldNotify([addOnly], 'breaking')).toBe(false);
  });
});

describe('notify', () => {
  it('does not throw when level is none', async () => {
    await expect(notify([added], { level: 'none' })).resolves.toBeUndefined();
  });

  it('calls sendWebhook when webhook provided', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
    await notify([removed], { level: 'breaking', webhook: 'http://example.com/hook' });
    expect(global.fetch).toHaveBeenCalledWith('http://example.com/hook', expect.objectContaining({ method: 'POST' }));
  });
});
