import orgFs from 'fs';
import os from 'os';
import { NFS_INTERNAL_TEST, NFS_WIN32_TIMEOUT } from '../constants';

function unlinkFix<T extends typeof orgFs.unlink>(fs: typeof orgFs, org: T): T {
  const newFunc: any = function(
    path: orgFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null) => void
  ) {
    let backoff = 0;
    const start = Date.now();
    const backoffUntil = start + NFS_WIN32_TIMEOUT;
    org.call(fs, path, function CB(er: NodeJS.ErrnoException) {
      if (backoff && er && er.code === 'ENOENT') {
        if (callback) callback(null);
      } else if (backoffUntil > start && Date.now() <= backoffUntil) {
        setTimeout(() => {
          if (!fs.existsSync(path)) {
            if (callback) callback(null);
          } else org.call(fs, path, CB);
        }, backoff);
        if (backoff < 250) backoff += 10;
      } else {
        if (callback) callback(er);
      }
    });
  };
  return newFunc as T;
}

function unlinkSyncFix<T extends typeof orgFs.unlinkSync>(
  fs: typeof orgFs,
  org: T
): T {
  const newFunc: any = function(path: orgFs.PathLike) {
    const start = Date.now();
    let backoff = 0;
    const backoffUntil = Date.now() + NFS_WIN32_TIMEOUT;
    function tryUnlink() {
      let err: NodeJS.ErrnoException | null = null;
      try {
        org.call(fs, path);
      } catch (e) {
        err = e;
      }

      if (backoff > 0 && err && err.code === 'ENOENT') {
        return;
      }

      if (
        fs.existsSync(path) ||
        (err &&
          (err.code === 'EACCS' || err.code === 'EPERM') &&
          backoffUntil > start)
      ) {
        if (backoff < 100) backoff += 10;
        const waitUntil = Date.now() + backoff;
        while (waitUntil > Date.now()) {}
        tryUnlink();
      } else if (err) {
        throw err;
      }
    }
    tryUnlink();
  };
  return newFunc as T;
}

export const patchUnlink = (fs: typeof orgFs) => {
  if (NFS_INTERNAL_TEST || os.platform() === 'win32') {
    fs.unlink = unlinkFix(fs, fs.unlink);
    fs.unlinkSync = unlinkSyncFix(fs, fs.unlinkSync);
  }
};
