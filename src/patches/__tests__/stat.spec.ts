import fs from 'fs';
import nfs from '../../';

// mock fs.statSync to return signed uids/gids
var realStatSync = fs.statSync;
fs.statSync = function(path) {
  var stats = realStatSync.call(fs, path);
  stats.uid = -2;
  stats.gid = -2;
  return stats;
};

describe('stat patch', () => {
  it('should use the same stats constructor as fs', () => {
    expect(nfs.Stats).toBe(fs.Stats);
    expect(fs.statSync(__filename)).toBeInstanceOf(fs.Stats);
    expect(nfs.statSync(__filename)).toBeInstanceOf(fs.Stats);
  });

  it('should return proper uid and gid', () => {
    if (!process.env.TEST_NFS_GLOBAL_PATCH) {
      expect(fs.statSync(__filename).uid).toBe(-2);
      expect(fs.statSync(__filename).gid).toBe(-2);
    }

    const expectedValue = process.platform !== 'win32' ? 0xfffffffe : 0;
    const stat = nfs.statSync(__filename);
    expect(stat.uid).toBe(expectedValue);
    expect(stat.gid).toBe(expectedValue);
  });

  it('should not throw when async stat fails', () => {
    nfs.stat(__filename + ' this does not exist', (err, stats) => {
      expect(err).toBeTruthy();
      expect(err.message).toContain('ENOENT');
      expect(stats).toBeFalsy();
    });
  });

  it('should throw ENOENT when sync stat fails', () => {
    expect(
      jest.fn(() => nfs.statSync(__filename + ' this does not exist'))
    ).toThrowError(/ENOENT/);
  });
});
