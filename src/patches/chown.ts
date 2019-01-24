import { chownErrOk } from '../utils/chownErrOk';
import orgFs from 'fs';

function chownFix<T extends Function>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  const newChown: any = function(
    path: orgFs.PathLike,
    uid: number,
    gid: number,
    callback: (err?: NodeJS.ErrnoException | null) => void
  ) {
    return orig.call(fs, path, uid, gid, function(
      err?: NodeJS.ErrnoException | null
    ) {
      if (chownErrOk(err)) {
        err = null;
      }
      if (callback) callback.call(fs, err);
    });
  };
  return newChown as T;
}

function chownSyncFix<T extends Function>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  const newChown: any = function(
    path: orgFs.PathLike,
    uid: number,
    gid: number
  ) {
    try {
      return orig.call(fs, path, uid, gid);
    } catch (err) {
      if (!chownErrOk(err)) {
        throw err;
      }
    }
  };
  return newChown as T;
}

export const patchChown = (fs: typeof orgFs) => {
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.
  fs.chown = chownFix(fs, fs.chown);
  fs.fchown = chownFix(fs, fs.fchown);
  fs.lchown = chownFix(fs, fs.lchown);
  fs.chownSync = chownSyncFix(fs, fs.chownSync);
  fs.fchownSync = chownSyncFix(fs, fs.fchownSync);
  fs.lchownSync = chownSyncFix(fs, fs.lchownSync);

  // if lchown do not exist, then make it no-op
  if (!fs.lchown) {
    (fs.lchown as any) = function(
      _path: orgFs.PathLike,
      uid: number,
      gid: number,
      callback: (err: NodeJS.ErrnoException) => void
    ) {
      if (callback) process.nextTick(callback);
    };
    fs.lchownSync = function() {};
  }
};
