import * as constants from 'constants';
import * as orgFs from 'fs';

function lchmodFix<T extends typeof orgFs.lchmod>(fs: typeof orgFs, org: T): T {
  const newFunc = function(
    path: orgFs.PathLike,
    mode: string | number,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(
      err,
      fd
    ) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, (err) => {
        fs.close(fd, (err2) => {
          if (callback) callback(err || err2);
        });
      });
    });
  };
  return newFunc as T;
}

function lchmodSyncFix<T extends typeof orgFs.lchmodSync>(
  fs: typeof orgFs,
  _org: T
): T {
  const newFunc: any = function(path: orgFs.PathLike, mode: string | number) {
    const fd = fs.openSync(
      path,
      constants.O_WRONLY | constants.O_SYMLINK,
      mode
    ); // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    let threw = true;
    let ret;
    try {
      ret = fs.fchmodSync(fd, mode);
      threw = false;
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd);
        } catch (er) {}
      } else {
        fs.closeSync(fd);
      }
    }
    return ret;
  };
  return newFunc as T;
}

export const patchLchmod = (fs: typeof orgFs) => {
  fs.lchmod = lchmodFix(fs, fs.lchmod);
  fs.lchmodSync = lchmodSyncFix(fs, fs.lchmodSync);
};
