import orgFs from 'fs';
import { fixer } from '../utils/fixer';
import { enqueue, retry } from '../queue';

export const patchOpen = (fs: typeof orgFs) => {
  const fs$open = fs.open;
  fs.open = fixer(fs, fs.open, function open(
    path: orgFs.PathLike,
    flags: string | number,
    mode: string | null,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = null;
    }
    return go$open(path, flags, mode, callback);
    function go$open(
      path: orgFs.PathLike,
      flags: string | number,
      mode: string | null,
      callback: (err: NodeJS.ErrnoException) => void
    ) {
      return fs$open(path, flags, mode, function(err, _fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, callback]]);
        else {
          if (typeof callback === 'function')
            callback.apply(fs, arguments as any);
          retry();
        }
      });
    }
  });
};
