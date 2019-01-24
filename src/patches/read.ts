import orgFs from 'fs';

// if read() returns EAGAIN, then just try it again.
function readFix<T extends typeof orgFs.read>(
  fs: typeof orgFs,
  org: typeof orgFs.read
): T {
  const newFunc: any = function(
    fd: number,
    buffer: orgFs.BinaryData,
    offset: number,
    length: number,
    position: number,
    callback_: (err: NodeJS.ErrnoException) => void
  ) {
    let callback: any;
    if (callback_ && typeof callback_ === 'function') {
      let eagCounter = 0;
      callback = function(er: NodeJS.ErrnoException, _: any, __: any) {
        if (er && er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter++;
          return org.call(fs, fd, buffer, offset, length, position, callback);
        }
        callback_.apply(fs, arguments as any);
      };
    }
    return org.call(fs, fd, buffer, offset, length, position, callback);
  };
  return newFunc as T;
}

function readSyncFix<T extends typeof orgFs.readSync>(
  fs: typeof orgFs,
  org: typeof orgFs.readSync
): T {
  const newFunc: any = function(
    fd: number,
    buffer: orgFs.BinaryData,
    offset: number,
    length: number,
    position: number
  ) {
    var eagCounter = 0;
    while (true) {
      try {
        return org.call(fs, fd, buffer, offset, length, position);
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter++;
          continue;
        }
        throw er;
      }
    }
  };
  return newFunc as T;
}

export const patchRead = (fs: typeof orgFs) => {
  fs.read = readFix(fs, fs.read);
  fs.readSync = readSyncFix(fs, fs.readSync);
};
