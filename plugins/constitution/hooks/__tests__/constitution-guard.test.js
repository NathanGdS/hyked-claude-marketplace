'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GUARD = path.join(__dirname, '..', 'constitution-guard.js');

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
