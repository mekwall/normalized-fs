import { chownErrOk } from '../utils/chownErrOk';
import orgFs from 'fs';

function chmodFix<T extends any>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  const newFunc: any = function(
    path: orgFs.PathLike,
    mode: string | number,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    return orig.call(fs, path, mode, function(
      err: NodeJS.ErrnoException | null
    ) {
      if (chownErrOk(err)) {
        err = null;
      }
      if (callback) callback.apply(fs, arguments as any);
    });
  };
  return newFunc as T;
}

function chmodSyncFix<T extends any>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  const newFunc: any = function(path: orgFs.PathLike, mode: string | number) {
    try {
      return orig.call(fs, path, mode);
    } catch (err) {
      if (!chownErrOk(err)) {
        throw err;
      }
    }
  };
  return newFunc as T;
}

export const patchChmod = (fs: typeof orgFs) => {
  fs.chmod = chmodFix(fs, fs.chmod);
  fs.chmodSync = chmodSyncFix(fs, fs.chmodSync);

  fs.fchmod = chmodFix(fs, fs.fchmod);
  fs.fchmodSync = chmodSyncFix(fs, fs.fchmodSync);

  fs.lchmod = chmodFix(fs, fs.lchmod);
  fs.lchmodSync = chmodSyncFix(fs, fs.lchmodSync);

  // if lchmod do not exist, then make it no-op
  if (!fs.lchmod) {
    (fs.lchmod as any) = function(
      _path: orgFs.PathLike,
      _mode: string | number,
      callback: () => void
    ) {
      if (callback) process.nextTick(callback);
    };
    fs.lchmodSync = function() {};
  }
};
