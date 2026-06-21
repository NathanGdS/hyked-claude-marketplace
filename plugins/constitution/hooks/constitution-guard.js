'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function resolveProjectRoot() {
  const cwd = process.cwd();
  const candidates = [cwd];
  try {
    const top = execSync('git rev-parse --show-toplevel', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (top && !candidates.includes(top)) candidates.push(top);
  } catch (_) {
    // not a git repo, or git unavailable -- fall through to cwd-only check
  }
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'CONSTITUTION.md'))) return dir;
  }
  return null;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readInput() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch (_) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw || '{}');
  } catch (_) {
    return null;
  }
  return {
    toolName: parsed.tool_name,
    toolInput: parsed.tool_input || {},
  };
}

function main() {
  const input = readInput();
  if (!input) process.exit(0);
  const projectRoot = resolveProjectRoot();
  if (!projectRoot) process.exit(0);
  if (!input.toolInput.file_path) process.exit(0);
  process.exit(0);
}

module.exports = {
  resolveProjectRoot,
  toPosix,
  readInput,
  main,
};

if (require.main === module) {
  main();
}
