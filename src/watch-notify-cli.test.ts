import { Command } from 'commander';
import { registerWatchNotifyCommand } from './watch-notify-cli';
import * as watchNotify from './watch-notify';

jest.mock('./watch-notify');

const mockedStart = watchNotify.startWatchNotify as jest.Mock;

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchNotifyCommand(program);
  return program;
}

beforeEach(() => {
  mockedStart.mockResolvedValue(jest.fn());
});

afterEach(() => {
  jest.clearAllMocks();
});

test('calls startWatchNotify with correct options', async () => {
  const program = makeProgram();
  await program.parseAsync(['node', 'test', 'watch-notify', '/app', '--webhook', 'http://hook.example.com']);
  expect(mockedStart).toHaveBeenCalledWith({
    dir: '/app',
    webhookUrl: 'http://hook.example.com',
    minSeverity: 'info',
    debounceMs: 500,
  });
});

test('passes custom severity and debounce', async () => {
  const program = makeProgram();
  await program.parseAsync([
    'node', 'test', 'watch-notify', '/app',
    '--webhook', 'http://hook.example.com',
    '--min-severity', 'breaking',
    '--debounce', '1000',
  ]);
  expect(mockedStart).toHaveBeenCalledWith({
    dir: '/app',
    webhookUrl: 'http://hook.example.com',
    minSeverity: 'breaking',
    debounceMs: 1000,
  });
});
