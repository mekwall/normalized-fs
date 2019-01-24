import fs from 'fs';

(fs as any).readdir = (_p: any, callback: any) => {
  process.nextTick(() => {
    callback(null, ['b', 'z', 'a']);
  });
};

import nfs from '../../';

describe('readdir patch', () => {
  it('should natural sort results', (done) => {
    nfs.readdir('whatevers', (err, files) => {
      if (err) {
        throw err;
      }
      expect(files).toEqual(['a', 'b', 'z']);
      done();
    });
  });
});
