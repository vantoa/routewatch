import { Command } from 'commander';
import { OutputFormat } from './output';

export interface OutputCLIOptions {
  format: OutputFormat;
  outFile?: string;
  color: boolean;
}

export function registerOutputOptions(command: Command): Command {
  return command
    .option(
      '-f, --format <format>',
      'output format: text, json, or markdown',
      (val) => {
        const valid: OutputFormat[] = ['text', 'json', 'markdown'];
        if (!valid.includes(val as OutputFormat)) {
          throw new Error(`Invalid format "${val}". Choose from: ${valid.join(', ')}`);
        }
        return val as OutputFormat;
      },
      'text'
    )
    .option('-o, --out <file>', 'write output to file instead of stdout')
    .option('--no-color', 'disable colored output');
}

export function parseOutputOptions(opts: Record<string, unknown>): OutputCLIOptions {
  return {
    format: (opts.format as OutputFormat) ?? 'text',
    outFile: opts.out as string | undefined,
    color: opts.color !== false,
  };
}
