import fs from 'fs';
import nfs from '../../';

// mock fs.statSync to return signed uids/gids
const realStatSync = fs.statSync;
fs.statSync = function(path) {
  const stats = realStatSync.call(fs, path);
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
