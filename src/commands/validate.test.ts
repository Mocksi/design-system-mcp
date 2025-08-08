import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';

function runValidate(envOverrides: Record<string, string | undefined> = {}) {
  const scriptPath = resolve(process.cwd(), 'bin/validate.js');
  const result = spawnSync('node', [scriptPath], {
    env: { ...process.env, ...envOverrides },
    encoding: 'utf-8',
  });
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), status: result.status };
}

describe('Validation CLI (bin/validate.js)', () => {
  let TEMP_ROOT: string;

  beforeEach(() => {
    TEMP_ROOT = mkdtempSync(join(tmpdir(), 'dsmcp-validate-'));
  });

  afterEach(() => {
    try { rmSync(TEMP_ROOT, { recursive: true, force: true }); } catch {}
  });

  it('prints helpful message when tokens directory does not exist', () => {
    const nonExistent = join(TEMP_ROOT, 'no-tokens-here');
    const { stdout, status } = runValidate({ DESIGN_TOKENS_PATH: nonExistent });
    expect(status).toBe(0);
    expect(stdout).toContain('Token files found: 0 files');
    expect(stdout).toContain('Categories discovered: none');
  });

  it('reports files and discovered categories for a minimal token set', () => {
    const tokensDir = join(TEMP_ROOT, 'tokens');
    mkdirSync(tokensDir, { recursive: true });

    // colors.json with top-level "colors"
    writeFileSync(join(tokensDir, 'colors.json'), JSON.stringify({
      colors: {
        primary: { $type: 'color', $value: '#3b82f6' }
      }
    }));

    // spacing.json with top-level "spacing"
    writeFileSync(join(tokensDir, 'spacing.json'), JSON.stringify({
      spacing: {
        sm: { $type: 'dimension', $value: '0.5rem' }
      }
    }));

    const { stdout, status } = runValidate({ DESIGN_TOKENS_PATH: tokensDir });
    expect(status).toBe(0);
    expect(stdout).toContain('Token files found: 2 files');
    expect(stdout).toMatch(/Categories discovered: .*colors.*spacing|Categories discovered: .*spacing.*colors/);
  });
});


