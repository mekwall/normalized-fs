import orgFs from 'fs';
import { fixer } from '../utils/fixer';
import { enqueue, retry } from '../queue';

export const patchReadFile = (fs: typeof orgFs) => {
  const fs$readFile = fs.readFile;
  fs.readFile = fixer(fs, fs.readFile, function(
    path: orgFs.PathLike,
    options: any,
    cb: (err: NodeJS.ErrnoException) => void
  ) {
    if (typeof options === 'function') (cb = options), (options = null);
    return readFile(path, options, cb);
    function readFile(
      path: orgFs.PathLike,
      options: any,
      cb: (err: NodeJS.ErrnoException) => void
    ) {
      return fs$readFile(path, options, function(err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([readFile, [path, options, cb]]);
        else {
          if (typeof cb === 'function') cb.apply(fs, arguments as any);
          retry();
        }
      });
    }
  });
};
