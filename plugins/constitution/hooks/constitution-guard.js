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

function applyEdit(content, edit) {
  const { old_string, new_string, replace_all } = edit;
  if (replace_all) return content.split(old_string).join(new_string);
  const idx = content.indexOf(old_string);
  if (idx === -1) return content;
  return content.slice(0, idx) + new_string + content.slice(idx + old_string.length);
}

function computePostEditContent(currentContent, toolName, toolInput) {
  if (toolName === 'Write') return toolInput.content || '';
  if (toolName === 'Edit') return applyEdit(currentContent, toolInput);
  if (toolName === 'MultiEdit') {
    let content = currentContent;
    for (const edit of toolInput.edits || []) content = applyEdit(content, edit);
    return content;
  }
  return currentContent;
}

function splitArticles(content) {
  const map = new Map();
  const re = /^### (CONST-\d+)[^\n]*$/gm;
  const matches = [...content.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const id = matches[i][1];
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    map.set(id, content.slice(start, end).trim());
  }
  return map;
}

function diffChangedArticleIds(preMap, postMap) {
  const ids = new Set([...preMap.keys(), ...postMap.keys()]);
  const changed = new Set();
  for (const id of ids) {
    if (preMap.get(id) !== postMap.get(id)) changed.add(id);
  }
  return changed;
}

function todayStr(date) {
  const d = date || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function amendmentHasSameDayEntry(amendmentsText, articleId, today) {
  const entries = amendmentsText.split(/^## Amendment /m).slice(1);
  for (const entry of entries) {
    const dateMatch = entry.match(/--\s*(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch || dateMatch[1] !== today) continue;
    const articleMatch = entry.match(/\*\*Article\(s\):\*\*\s*(.+)/);
    if (!articleMatch) continue;
    const ids = articleMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.includes(articleId)) return true;
  }
  return false;
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

  if (filePath === path.resolve(constitutionPath)) {
    const postContent = computePostEditContent(constitutionText, input.toolName, input.toolInput);
    const preMap = splitArticles(constitutionText);
    const postMap = splitArticles(postContent);
    const changed = [...diffChangedArticleIds(preMap, postMap)];
    if (changed.length === 0) process.exit(0);

    const amendmentsPath = path.join(projectRoot, 'AMENDMENTS.md');
    const amendmentsText = fs.existsSync(amendmentsPath)
      ? fs.readFileSync(amendmentsPath, 'utf8')
      : '';
    const today = todayStr();
    const missing = changed.filter((id) => !amendmentHasSameDayEntry(amendmentsText, id, today));
    if (missing.length > 0) {
      process.stderr.write(
        `Constitutional self-edit blocked: ${missing.join(', ')} changed in CONSTITUTION.md with ` +
          `no matching same-day entry in AMENDMENTS.md. Log the Amendment first.\n`
      );
      process.exit(2);
    }
    process.exit(0);
  }

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
  applyEdit,
  computePostEditContent,
  splitArticles,
  diffChangedArticleIds,
  todayStr,
  amendmentHasSameDayEntry,
  main,
};

if (require.main === module) {
  main();
}
