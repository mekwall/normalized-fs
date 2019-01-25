import orgFs from 'fs';
import { normalize } from '../../';

const strings = ['b', 'z', 'a'];
const buffs = strings.map((s) => {
  return Buffer.from(s);
});
const hexes = buffs.map((b) => {
  return b.toString('hex');
});

function getRet(encoding: string | null) {
  switch (encoding) {
    case 'hex':
      return hexes;
    case 'buffer':
      return buffs;
    default:
      return strings;
  }
}

describe('readdir patch', () => {
  it('should natural sort results', (done) => {
    const fs = require('fs');
    fs.readdir = (_p: any, callback: any) => {
      process.nextTick(() => {
        callback(null, ['b', 'z', 'a']);
      });
    };
    const nfs: typeof orgFs = normalize(fs);
    nfs.readdir('whatevers', (err, files) => {
      if (err) {
        throw err;
      }
      expect(files).toEqual(['a', 'b', 'z']);
      done();
    });
  });

  const encodings = ['buffer', 'hex', 'utf8', null];
  encodings.forEach((encoding) => {
    it(`should work with encoding ${encoding}`, () => {
      let failed = false;
      const fs = require('fs');
      fs.readdir = function(
        _path: orgFs.PathLike,
        options: any,
        callback: (err: NodeJS.ErrnoException | null, res?: any) => void
      ) {
        if (!failed) {
          // simulate an EMFILE and then open and close a thing to retry
          failed = true;
          process.nextTick(function() {
            const err: NodeJS.ErrnoException = new Error('synthetic emfile');
            err.code = 'EMFILE';
            callback(err);
            process.nextTick(function() {
              nfs.closeSync(fs.openSync(__filename, 'r'));
            });
          });
          return;
        }

        failed = false;
        expect(typeof callback).toBe('function');
        expect(typeof options).toBe('object');
        process.nextTick(() => {
          callback(null, getRet(options.encoding));
        });
      };
      const nfs = normalize(fs);
      nfs.readdir('whatevers', { encoding }, (err, files) => {
        if (err) {
          throw err;
        }
        const res = files;
        const ret = Array.from<any>(getRet(encoding)).sort();
        expect(res).toEqual(ret);
      });
    });
  });
});
