import orgFs from 'fs';
import os from 'os';

const win32MaxBackoff = process.env.NFS_WIN32_MAX_BACKOFF
  ? parseInt(process.env.NFS_WIN32_MAX_BACKOFF, 10)
  : 60000;

function renameFix<T extends typeof orgFs.rename>(fs: typeof orgFs, org: T): T {
  const newFunc: any = function(
    from: orgFs.PathLike,
    to: orgFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null) => void
  ) {
    try {
      const stat = fs.statSync(to);
      if (!stat) return;
      if (stat.isDirectory()) {
        fs.rmdirSync(to);
      } else {
        fs.unlinkSync(to);
      }
    } catch (e) {
      if (e.code === 'ENOTEMPTY') {
        // target directory not empty, can't rename
        if (callback) callback(e);
        return;
      }
      // ignore other errors
    }
    const start = Date.now();
    let backoff = 0;
    let backoffUntil = start + win32MaxBackoff;
    org.call(fs, from, to, function CB(er: NodeJS.ErrnoException) {
      if (
        er &&
        (er.code === 'EACCES' || er.code === 'EPERM') &&
        Date.now() < backoffUntil
      ) {
        setTimeout(() => {
          fs.stat(from, (erFrom, statFrom) => {
            fs.stat(to, (erTo, statTo) => {
              if (erFrom && !erTo) {
                // If the source no longer exists we
                // can probably assume it was moved
                if (callback) callback(null);
              } else if (
                statFrom &&
                statTo &&
                statFrom.size === statTo.size &&
                statFrom.ctime === statTo.ctime
              ) {
                // If the source and target have
                // the same size and ctime, we
                // can assume it was moved
                if (callback) callback(null);
              } else org.call(fs, from, to, CB);
            });
          });
        }, backoff);
        if (backoff < 250) backoff += 10;
      } else if (backoff && er && er.code === 'ENOENT') {
        // The source does no longer exist so we
        // can assume it was moved during one of the tries
        if (callback) callback(null);
      } else {
        if (callback) callback(er);
      }
    });
  };
  return newFunc as T;
}

function renameSyncFix<T extends typeof orgFs.renameSync>(
  fs: typeof orgFs,
  org: T
): T {
  const newFunc: any = function(from: orgFs.PathLike, to: orgFs.PathLike) {
    try {
      var stat = fs.statSync(to);
      if (!stat) return;
      if (stat.isDirectory()) {
        fs.rmdirSync(to);
      } else {
        fs.unlinkSync(to);
      }
    } catch (e) {
      if (e.code === 'ENOTEMPTY') {
        // target directory not empty, can't rename
        throw e;
      }
      // ignore other errors
    }
    var start = Date.now();
    var backoff = 0;
    var backoffUntil = start + win32MaxBackoff;
    function tryRename() {
      try {
        org.call(fs, from, to);
      } catch (e) {
        if (
          (e.code === 'EACCS' || e.code === 'EPERM') &&
          start < backoffUntil
        ) {
          if (backoff < 100) backoff += 10;
          var waitUntil = Date.now() + backoff;
          while (waitUntil > Date.now()) {}
          tryRename();
        } else if (backoff > 0 && e.code === 'ENOENT') {
          // The source does no longer exist because so we can
          // assume it was moved
        } else {
          throw e;
        }
        // Wait until destination exists and source no longer
        // exists or that we've reached the backoff limit
        while (
          (fs.existsSync(from) || !fs.existsSync(to)) &&
          Date.now() < backoffUntil
        ) {}
      }
    }
    tryRename();
  };
  return newFunc as T;
}

export const patchRename = (fs: typeof orgFs) => {
  // fs.rename and fs.renameSync uses MoveFileEx function on Windows.
  // MoveFileEx is not atomic and honors Windows sharing modes, compared to
  // os/syscall.rename used by Linux and OSX that are atomic and does not
  // care if the file or directory is locked.
  //
  // This means that whenever a file or parent directory is locked (in use)
  // on Windows the rename might fail with EACCS or EPERM errors depending
  // the sharing mode set on the file and/or directory.
  //
  // These win32-only overrides try to normalize fs.rename/renameSync
  // behavior so it's more in line with how it works on Linux and OSX.
  // It does this by retrying a failed rename for up to 5 seconds (or
  // value of GRACEFUL_FS_WIN32_MAX_BACKOFF) until actually failing.
  if (process.env.NODE_ENV === 'test' || os.platform() === 'win32') {
    fs.rename = renameFix(fs, fs.rename);
    fs.renameSync = renameSyncFix(fs, fs.renameSync);
  }
};
