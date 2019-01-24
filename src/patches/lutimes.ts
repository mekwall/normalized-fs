import * as orgFs from 'fs';
import * as constants from 'constants';

declare module 'fs' {
  function lutimes(
    path: orgFs.PathLike,
    atime: string | number | Date,
    mtime: string | number | Date,
    callback: (err: NodeJS.ErrnoException) => void
  ): void;

  function lutimesSync(
    path: orgFs.PathLike,
    atime: string | number | Date,
    mtime: string | number | Date
  ): void;
}

export const patchLutimes = (fs: typeof orgFs) => {
  if (constants.hasOwnProperty('O_SYMLINK')) {
    fs.lutimes = function(path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function(er, fd) {
        if (er) {
          if (cb) cb(er);
          return;
        }
        fs.futimes(fd, at, mt, function(er) {
          fs.close(fd, function(er2) {
            if (cb) cb(er || er2);
          });
        });
      });
    };

    fs.lutimesSync = function(path, at, mt) {
      const fd = fs.openSync(path, constants.O_SYMLINK);
      let ret;
      let threw = true;
      try {
        ret = fs.futimesSync(fd, at, mt);
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
  } else {
    fs.lutimes = function(_a, _b, _c, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lutimesSync = function() {};
  }
};
