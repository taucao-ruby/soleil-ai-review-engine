import { describe, expect, it, vi, afterEach } from 'vitest';
import { createLazyAction } from '../../src/cli/lazy-action.js';

describe('createLazyAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not import target module until invoked', async () => {
    const loader = vi.fn(async () => ({
      run: vi.fn(async () => 'ok'),
    }));

    const action = createLazyAction(loader, 'run');

    expect(loader).not.toHaveBeenCalled();
    await expect(action('arg-1')).resolves.toBeUndefined();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not call process.exit or console.error on success', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    const action = createLazyAction(async () => ({ run: async () => 'ok' }), 'run');
    await action();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('prints a clean message and exits 1 when export is not a function, instead of throwing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);

    const action = createLazyAction(async () => ({ notAFunction: 'string-value' }), 'notAFunction');

    await expect(action()).rejects.toThrow('exit:1');
    expect(consoleErrorSpy).toHaveBeenCalledWith('soleil-ai-review-engine: Lazy action export not found: notAFunction');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints a clean message and exits 1 when the action throws, instead of an unhandled rejection', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);

    const loader = async () => ({
      failingCommand: async () => {
        throw new Error('Multiple repositories indexed. Specify which one with the "repo" parameter. Available: a, b');
      },
    });

    const action = createLazyAction(loader, 'failingCommand');

    await expect(action()).rejects.toThrow('exit:1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'soleil-ai-review-engine: Multiple repositories indexed. Specify which one with the "repo" parameter. Available: a, b'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
