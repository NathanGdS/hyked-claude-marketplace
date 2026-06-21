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

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

function parseForbiddenPatterns(constitutionText) {
  const headingIdx = constitutionText.indexOf('## Forbidden Patterns');
  if (headingIdx === -1) return [];
  const lines = constitutionText.slice(headingIdx).split('\n');
  const tableLines = [];
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      started = true;
      tableLines.push(trimmed);
    } else if (started) {
      break;
    }
  }
  if (tableLines.length < 2) return [];
  const rows = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) continue;
    const [pattern, violates, scopeGlob, regexStr] = cells;
    rows.push({ pattern, violates, scopeGlob, regexStr });
  }
  return rows;
}

function getEditedTexts(toolName, toolInput) {
  if (toolName === 'Write') return [toolInput.content || ''];
  if (toolName === 'Edit') return [toolInput.new_string || ''];
  if (toolName === 'MultiEdit') return (toolInput.edits || []).map((e) => e.new_string || '');
  return [];
}

function checkForbiddenPatterns(rows, relativeFilePath, editedTexts) {
  for (const row of rows) {
    let scopeRe;
    try {
      scopeRe = globToRegex(row.scopeGlob);
    } catch (_) {
      continue;
    }
    if (!scopeRe.test(relativeFilePath)) continue;
    let patternRe;
    try {
      patternRe = new RegExp(row.regexStr);
    } catch (_) {
      continue;
    }
    for (const text of editedTexts) {
      if (patternRe.test(text)) return row;
    }
  }
  return null;
}

function main() {
  const input = readInput();
  if (!input) process.exit(0);
  const projectRoot = resolveProjectRoot();
  if (!projectRoot) process.exit(0);
  if (!input.toolInput.file_path) process.exit(0);

  const constitutionPath = path.join(projectRoot, 'CONSTITUTION.md');
  const constitutionText = fs.readFileSync(constitutionPath, 'utf8');
  const filePath = path.resolve(projectRoot, input.toolInput.file_path);
  const relativeFilePath = toPosix(path.relative(projectRoot, filePath));

  const rows = parseForbiddenPatterns(constitutionText);
  const editedTexts = getEditedTexts(input.toolName, input.toolInput);
  const violation = checkForbiddenPatterns(rows, relativeFilePath, editedTexts);
  if (violation) {
    process.stderr.write(
      `Constitutional Conflict Detected: ${violation.violates} forbids "${violation.pattern}". ` +
        `Use the amendment process (constitution-keeper skill) instead of editing around the rule.\n`
    );
    process.exit(2);
  }
  process.exit(0);
}

module.exports = {
  resolveProjectRoot,
  toPosix,
  readInput,
  globToRegex,
  parseForbiddenPatterns,
  getEditedTexts,
  checkForbiddenPatterns,
  main,
};

if (require.main === module) {
  main();
}
