'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GUARD = path.join(__dirname, '..', 'constitution-guard.js');
const { todayStr } = require('../constitution-guard.js');

function run(payload, cwd) {
  return spawnSync(process.execPath, [GUARD], {
    input: JSON.stringify(payload),
    cwd,
    encoding: 'utf8',
  });
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'constitution-guard-'));
}

function writeConstitution(dir, body) {
  fs.writeFileSync(path.join(dir, 'CONSTITUTION.md'), body, 'utf8');
}

const FORBIDDEN_PATTERNS_FIXTURE = `# Project Constitution

### CONST-001 -- No console.log in source
**Rule:** Do not use console.log for debugging output in src/.
**Rationale:** Pollutes production logs and may leak sensitive data.
**Protects against:** Noisy logs, leaked debug info in production.
**Exceptions:** None.
**Implemented in:** Foundational

## Forbidden Patterns

| Pattern | Violates | File scope (glob) | Pattern (regex) |
|---|---|---|---|
| console.log | CONST-001 | src/**/*.js | console\\.log\\( |

## Amendment History

See AMENDMENTS.md
`;

const SELF_EDIT_FIXTURE = `# Project Constitution

### CONST-001 -- No console.log in source
**Rule:** Do not use console.log for debugging output in src/.
**Rationale:** Pollutes production logs and may leak sensitive data.
**Protects against:** Noisy logs, leaked debug info in production.
**Exceptions:** None.
**Implemented in:** Foundational

## Forbidden Patterns

| Pattern | Violates | File scope (glob) | Pattern (regex) |
|---|---|---|---|
| console.log | CONST-001 | src/**/*.js | console\\.log\\( |

## Amendment History

See AMENDMENTS.md
`;

const SELF_EDIT_OLD_STRING = '**Rule:** Do not use console.log for debugging output in src/.';
const SELF_EDIT_NEW_STRING =
  '**Rule:** Do not use console.log or console.debug for debugging output in src/.';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test('no CONSTITUTION.md in project -> allow, no output', () => {
  const dir = makeTempDir();
  const result = run(
    { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'foo.js'), content: 'whatever' } },
    dir
  );
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stderr, '');
});

test('Write introducing a forbidden pattern -> deny', () => {
  const dir = makeTempDir();
  writeConstitution(dir, FORBIDDEN_PATTERNS_FIXTURE);
  const result = run(
    {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(dir, 'src', 'app.js'),
        content: 'function run() {\n  console.log("debug");\n}\n',
      },
    },
    dir
  );
  assert.strictEqual(result.status, 2);
  assert.match(result.stderr, /CONST-001/);
});

test('Edit introducing a forbidden pattern -> deny', () => {
  const dir = makeTempDir();
  writeConstitution(dir, FORBIDDEN_PATTERNS_FIXTURE);
  const result = run(
    {
      tool_name: 'Edit',
      tool_input: {
        file_path: path.join(dir, 'src', 'app.js'),
        old_string: 'function run() {}',
        new_string: 'function run() {\n  console.log("x");\n}',
      },
    },
    dir
  );
  assert.strictEqual(result.status, 2);
  assert.match(result.stderr, /CONST-001/);
});

test('Edit with no forbidden pattern -> allow', () => {
  const dir = makeTempDir();
  writeConstitution(dir, FORBIDDEN_PATTERNS_FIXTURE);
  const result = run(
    {
      tool_name: 'Edit',
      tool_input: {
        file_path: path.join(dir, 'src', 'app.js'),
        old_string: 'function run() {}',
        new_string: 'function run() {\n  return 42;\n}',
      },
    },
    dir
  );
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stderr, '');
});

test('self-edit to CONSTITUTION.md without same-day amendment -> deny', () => {
  const dir = makeTempDir();
  writeConstitution(dir, SELF_EDIT_FIXTURE);
  fs.writeFileSync(path.join(dir, 'AMENDMENTS.md'), '# Amendments\n', 'utf8');
  const result = run(
    {
      tool_name: 'Edit',
      tool_input: {
        file_path: path.join(dir, 'CONSTITUTION.md'),
        old_string: SELF_EDIT_OLD_STRING,
        new_string: SELF_EDIT_NEW_STRING,
      },
    },
    dir
  );
  assert.strictEqual(result.status, 2);
  assert.match(result.stderr, /CONST-001/);
  assert.match(result.stderr, /Amendment/);
});

test('self-edit to CONSTITUTION.md with matching same-day amendment -> allow', () => {
  const dir = makeTempDir();
  writeConstitution(dir, SELF_EDIT_FIXTURE);
  const today = todayStr();
  const amendments = `# Amendments

## Amendment 1 -- ${today}
**Article(s):** CONST-001
**Scope:** global rule change
**Before:** Do not use console.log for debugging output in src/.
**After:** Do not use console.log or console.debug for debugging output in src/.
**Rationale:** Need to also catch console.debug calls.
**Author:** test
`;
  fs.writeFileSync(path.join(dir, 'AMENDMENTS.md'), amendments, 'utf8');
  const result = run(
    {
      tool_name: 'Edit',
      tool_input: {
        file_path: path.join(dir, 'CONSTITUTION.md'),
        old_string: SELF_EDIT_OLD_STRING,
        new_string: SELF_EDIT_NEW_STRING,
      },
    },
    dir
  );
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stderr, '');
});

let failures = 0;
for (const t of tests) {
  try {
    t.fn();
    console.log(`PASS ${t.name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${t.name}`);
    console.error(err);
  }
}
if (failures > 0) {
  console.error(`${failures}/${tests.length} tests failed`);
  process.exit(1);
}
console.log(`${tests.length}/${tests.length} tests passed`);
