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
