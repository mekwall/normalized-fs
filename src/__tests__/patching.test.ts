const fnNames = [
  'close',
  'closeSync',
  'open',
  'appendFile',
  'chown',
  'fchown',
  'lchown',
  'chownSync',
  'fchownSync',
  'lchownSync',
  'chmod',
  'fchmod',
  'lchmod',
  'chmodSync',
  'fchmodSync',
  'lchmodSync',
  'lchmod',
  'lutimes',
  'open',
  'read',
  'readdir',
  'readFile',
  'createReadStream',
  'rename',
  'renameSync',
  'stat',
  'writeFile',
  'createWriteStream',
];

const orgFunctions = fnNames.map((name) => require('fs')[name]);
const patchedFsSource = require('../index');
const patchedFsBuild = require('import-fresh')('../../lib/index');

describe('patching from source', () => {
  fnNames.forEach((name, i) => {
    it(`should patch ${name}`, () => {
      expect((patchedFsSource as any)[name]).not.toBe(orgFunctions[i]);
    });
  });
});

describe('patching from build', () => {
  fnNames.forEach((name, i) => {
    it(`should patch ${name}`, () => {
      expect((patchedFsBuild as any)[name]).not.toBe(orgFunctions[i]);
    });
  });
});
