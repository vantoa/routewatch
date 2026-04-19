import { startWatchNotify } from './watch-notify';
import * as watcher from './watcher';
import * as notify from './notify';
import axios from 'axios';

jest.mock('axios');
jest.mock('./watcher');
jest.mock('./notify');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedWatch = watcher.watchRoutes as jest.Mock;
const mockedShouldNotify = notify.shouldNotify as jest.Mock;
const mockedBuildPayload = notify.buildPayload as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockedWatch.mockImplementation((_dir, cb) => {
    (global as any).__watchCb = cb;
    return jest.fn();
  });
  mockedShouldNotify.mockReturnValue(true);
  mockedBuildPayload.mockReturnValue({ changes: [] });
  mockedAxios.post.mockResolvedValue({ status: 200 });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('posts to webhook when changes occur', async () => {
  const stop = await startWatchNotify({ dir: '/tmp', webhookUrl: 'http://example.com/hook' });
  (global as any).__watchCb([{ type: 'added', route: '/api/test', methods: ['GET'] }]);
  jest.runAllTimers();
  await Promise.resolve();
  expect(mockedAxios.post).toHaveBeenCalledWith('http://example.com/hook', { changes: [] });
  stop();
});

test('skips posting when shouldNotify returns false', async () => {
  mockedShouldNotify.mockReturnValue(false);
  const stop = await startWatchNotify({ dir: '/tmp', webhookUrl: 'http://example.com/hook' });
  (global as any).__watchCb([]);
  jest.runAllTimers();
  await Promise.resolve();
  expect(mockedAxios.post).not.toHaveBeenCalled();
  stop();
});

test('debounces multiple rapid changes', async () => {
  const stop = await startWatchNotify({ dir: '/tmp', webhookUrl: 'http://example.com/hook', debounceMs: 300 });
  (global as any).__watchCb([{ type: 'added', route: '/a', methods: ['GET'] }]);
  (global as any).__watchCb([{ type: 'added', route: '/b', methods: ['POST'] }]);
  jest.runAllTimers();
  await Promise.resolve();
  expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  stop();
});
